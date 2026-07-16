require('dotenv').config();
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const connectDB = require('../../config/db');
const ApplicationStateMachine = require('../engine/ApplicationStateMachine');
const BrowserPool = require('../browser/BrowserPool');
const ContextManager = require('../browser/ContextManager');
const SessionManager = require('../browser/SessionManager');
const GreenhouseConnector = require('../connectors/greenhouse/GreenhouseConnector');
const TelemetryManager = require('../telemetry/TelemetryManager');
const BrowserEventLogger = require('../telemetry/BrowserEventLogger');
const Job = require('../../models/Job');
const logger = require('../../config/logger');

// Strategy pattern for selecting connector
const getConnectorClass = (name) => {
  switch (name.toLowerCase()) {
    case 'greenhouse':
      return GreenhouseConnector;
    // Add other ATS connectors here
    default:
      return null;
  }
};

async function bootstrap() {
  try {
    logger.info('Mongo Connecting...');
    await connectDB();
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Mongoose connection failed to reach readyState 1');
    }
    logger.info('Mongo Connected');

    logger.info('Redis Connecting...');
    const redisConnection = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      maxRetriesPerRequest: null,
      lazyConnect: true
    });
    
    await redisConnection.connect();
    logger.info('Redis Connected');

    await BrowserPool.initialize();
    logger.info('Browser Manager Ready');

    const worker = new Worker('JobApplications', async job => {
      const { sessionId, jobId, userId, connectorName } = job.data;
      
      const stateMachine = new ApplicationStateMachine(sessionId);
      const telemetry = new TelemetryManager(sessionId, connectorName);
      const eventLogger = new BrowserEventLogger(sessionId);
      let browser, context, page;
      
      try {
        await eventLogger.info('JobStarted', `Worker started processing job for ${connectorName}`);
        
        // Load job details
        const targetJob = await Job.findById(jobId);
        if (!targetJob) throw new Error('Job not found in database');

        const ConnectorClass = getConnectorClass(connectorName);
        if (!ConnectorClass) throw new Error(`Unsupported connector: ${connectorName}`);

        // Load session info
        const appSession = await stateMachine.load();
        const profileData = appSession.stateData.profileData;

        await stateMachine.updateState('BrowserStarted');
        
        // Setup Browser & Context
        browser = await BrowserPool.acquire();
        const contextManager = new ContextManager(browser);
        context = await contextManager.createContext();
        
        const browserSession = await SessionManager.getOrCreateSession(userId, connectorName);
        await contextManager.injectSessionData(context, browserSession);

        page = await context.newPage();
        const connector = new ConnectorClass(context, page, browserSession, sessionId);

        // Run State Machine flow
        telemetry.startPageLoad();
        await connector.initialize();
        await connector.openJob(targetJob.applyUrl);
        telemetry.endPageLoad();
        
        await stateMachine.updateState('JobOpened');
        await connector.detectApplication();

        // Uploads
        await connector.uploadResume(profileData.resume);
        if (profileData.coverLetter) {
            await connector.uploadCoverLetter(profileData.coverLetter);
        }
        await stateMachine.updateState('ResumeUploaded');

        // Fill profile & questions
        await connector.fillProfile(profileData);
        await connector.answerQuestions(profileData);
        await stateMachine.updateState('QuestionsAnswered');

        // Review & Submit
        await connector.review();
        await stateMachine.updateState('ReadyForSubmission');
        
        await connector.submit();
        await stateMachine.updateState('Submitted');

        // Verify
        await connector.verify();
        await stateMachine.updateState('Verified');
        
        await connector.captureEvidence('Screenshot', 'Completed');
        await stateMachine.updateState('Completed');

        await telemetry.finalize(true);
        await eventLogger.info('JobCompleted', 'Application submitted successfully');

        return { success: true };

      } catch (error) {
        logger.error(`Application Job Failed: ${error.message}`);
        await eventLogger.error('JobFailed', error.message, { stack: error.stack });
        
        const canRetry = await stateMachine.incrementRetry();
        telemetry.recordRetry();

        if (canRetry) {
          await stateMachine.updateState('Failed', null, error);
          throw error; // Let BullMQ retry
        } else {
          await stateMachine.updateState('Cancelled', null, new Error('Max retries exceeded'));
          await telemetry.finalize(false);
        }
        
        return { success: false, error: error.message };

      } finally {
        // Cleanup
        if (context) {
          try {
            const newSessionData = await new ContextManager(null).extractSessionData(context);
            const actualSessionId = (await SessionManager.getOrCreateSession(userId, connectorName)).sessionId;
            await SessionManager.saveSessionData(actualSessionId, newSessionData);
          } catch (err) {
            logger.error(`Failed to save session data: ${err.message}`);
          }
          await context.close().catch(() => {});
        }
        if (browser) BrowserPool.release(browser);
      }
    }, {
      connection: redisConnection,
      concurrency: 5 // Run 5 concurrent browsers
    });

    worker.on('failed', (job, err) => {
      logger.error(`BullMQ Job ${job?.id} failed: ${err.message}`);
    });

    worker.on('ready', () => {
      logger.info('BullMQ Ready');
      logger.info('Worker Ready');
    });

  } catch (error) {
    logger.error(`Worker startup failed: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
