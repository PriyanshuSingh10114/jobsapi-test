require('dotenv').config();
const { Worker } = require('bullmq');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const connectDB = require('../../config/db');
const ApplicationStateMachine = require('../engine/ApplicationStateMachine');
const BrowserPool = require('../browser/BrowserPool');
const ContextManager = require('../browser/ContextManager');
const SessionManager = require('../browser/SessionManager');
const AutomationContext = require('../browser/AutomationContext');
const GreenhouseConnector = require('../connectors/greenhouse/GreenhouseConnector');
const TelemetryManager = require('../telemetry/TelemetryManager');
const BrowserEventLogger = require('../telemetry/BrowserEventLogger');
const CandidateProfileResolver = require('../engine/CandidateProfileResolver');
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
      let browser, context, page, automationContext;
      
      try {
        const startTime = Date.now();
        await eventLogger.info('JobStarted', `Worker started processing job for ${connectorName}`);
        
        // Load job details
        const targetJob = await Job.findById(jobId);
        if (!targetJob) throw new Error('Job not found in database');

        const ConnectorClass = getConnectorClass(connectorName);
        if (!ConnectorClass) throw new Error(`Unsupported connector: ${connectorName}`);

        // Load session info
        const appSession = await stateMachine.load();
        
        if (appSession.status === 'Queued' || appSession.status === 'Created') {
            await stateMachine.updateState('WorkerAssigned');
        } else if (appSession.status === 'WaitingForUser') {
            await stateMachine.updateState('ReadyForSubmission');
        }
        
        const runStep = async (targetState, fn) => {
            if (stateMachine.shouldExecute(targetState)) {
                await stateMachine.updateState(targetState);
                if (fn) await fn();
            }
        };

        // PHASE 1: Profile Loading & Validation (PLAYWRIGHT-FREE)
        let profileData;
        await runStep('LoadingProfile', async () => {
            profileData = await CandidateProfileResolver.fetchAndNormalize(userId);
            
            // Log the normalized profile before resolution
            await eventLogger.info('ProfileNormalized', 'Candidate Profile fetched and normalized successfully', {
                educationCount: profileData.education?.length || 0,
                experienceCount: profileData.experience?.length || 0,
                hasDefaultResume: !!profileData.documents?.defaultResume,
                hasCoverLetter: profileData.documents?.coverLetters?.length > 0
            });

            // Cache normalized profile in DB stateData for debugging if needed
            const ApplicationSession = require('../../models/ApplicationSession');
            await ApplicationSession.findByIdAndUpdate(sessionId, { $set: { 'stateData.profileData': profileData } });
        });
        
        // If skipped LoadingProfile, we still need profileData in memory for later steps
        if (!profileData) profileData = appSession.stateData?.profileData || await CandidateProfileResolver.fetchAndNormalize(userId);

        await runStep('ValidatingProfile', async () => {
            const validationReport = CandidateProfileResolver.validate(profileData);
            
            if (!validationReport.canContinue) {
                await eventLogger.error('ProfileValidationError', `Automation blocked. Critical fields missing: ${validationReport.criticalErrors.join(', ')}`);
                const error = new Error(`Profile is critically incomplete. Missing: ${validationReport.criticalErrors.join(', ')}`);
                error.name = 'ValidationError';
                throw error;
            }

            if (validationReport.warnings.length > 0) {
                await eventLogger.info('ProfileValidationWarning', `Profile has warnings but automation will continue. Missing optional fields: ${validationReport.warnings.join(', ')}`, validationReport);
            }

            await eventLogger.info('ProfileDiagnostics', 'Profile successfully resolved and validated.', {
               resume: !!profileData.documents.defaultResume,
               linkedin: !!profileData.links.linkedin,
               phone: !!profileData.contact.phone,
               educationCount: profileData.education.length,
               experienceCount: profileData.experience.length,
               projectsCount: profileData.projects.length,
               completionPercentage: validationReport.completion
            });

            // Cache validation report for RootCauseReport
            const ApplicationSession = require('../../models/ApplicationSession');
            await ApplicationSession.findByIdAndUpdate(sessionId, { $set: { 'stateData.validationReport': validationReport } });
        });

        // PHASE 2: Single Browser Acquisition & Context Initialization
        await runStep('BrowserStarting');
        
        await runStep('BrowserReady', async () => {
            browser = await BrowserPool.acquire(sessionId);
            const contextManager = new ContextManager(browser);
            context = await contextManager.createContext();
            
            const browserSession = await SessionManager.getOrCreateSession(userId, connectorName);
            await contextManager.injectSessionData(context, browserSession);

            page = await context.newPage();
            automationContext = new AutomationContext({
                sessionId,
                jobId,
                userId,
                browser,
                context,
                page,
                owner: 'WorkerProcessor'
            });
            automationContext.logOwnership('BrowserReady', 'WorkerProcessor');
        });

        // Ensure browser context exists if resuming past BrowserReady
        if (!automationContext) {
            browser = await BrowserPool.acquire(sessionId);
            const contextManager = new ContextManager(browser);
            context = await contextManager.createContext();
            const browserSession = await SessionManager.getOrCreateSession(userId, connectorName);
            await contextManager.injectSessionData(context, browserSession);
            page = await context.newPage();
            automationContext = new AutomationContext({
                sessionId,
                jobId,
                userId,
                browser,
                context,
                page,
                owner: 'WorkerProcessor'
            });
            automationContext.logOwnership('BrowserReadyResumed', 'WorkerProcessor');
        }

        const browserSession = await SessionManager.getOrCreateSession(userId, connectorName);
        const connector = new ConnectorClass(automationContext, browserSession);

        // Run State Machine flow
        telemetry.startPageLoad();
        await runStep('OpeningJob', async () => {
             await connector.initialize();
             await connector.openJob(targetJob.applyUrl);
        });
        telemetry.endPageLoad();
        
        await runStep('AnalyzingPage', async () => {
             await connector.detectApplication();
        });
        
        await runStep('AnalyzingForm', async () => {
             // detection populated the semantic map
             logger.info('AnalyzingForm completed');
        });

        await runStep('ResolvingFields', async () => {
             await connector.resolveFields(profileData);
        });

        await runStep('UploadingResume', async () => {
             await connector.uploadResume(profileData);
             await connector.uploadCoverLetter(profileData);
        });

        await runStep('GeneratingAIAnswers', async () => {
             await connector.generateAIAnswers(profileData);
        });

        await runStep('FillingFields', async () => {
             await connector.fillFields(profileData);
        });

        await runStep('ValidatingFilledFields', async () => {
             await connector.validateFilledFields();
        });

        const { completedFields, pendingFields } = connector;
        const totalFields = completedFields.length + pendingFields.length;
        const completionPercentage = totalFields === 0 ? 100 : Math.round((completedFields.length / totalFields) * 100);
        const executionTimeSec = Math.round((Date.now() - startTime) / 1000);
        
        const rootCauseReport = {
            profileCompleteness: appSession.stateData?.validationReport || null,
            resolutionReport: connector.resolutionReport || null,
            finalAction: pendingFields.length > 0 ? 'Paused for manual input' : 'Submitted'
        };

        const applicationReport = {
            totalFieldsDetected: totalFields,
            fieldsFilled: completedFields.length,
            fieldsSkipped: pendingFields.length,
            completionPercentage,
            skippedReasons: pendingFields.map(p => ({ label: p.label, reason: p.reason })),
            executionTimeSeconds: executionTimeSec,
            aiGeneratedAnswers: completedFields.filter(f => f.startsWith('AI_')).length,
            uploadsCompleted: completedFields.filter(f => f.includes('UPLOAD')).length,
            rootCauseReport
        };

        if (pendingFields.length > 0) {
            await runStep('WaitingForUser', async () => {
               await stateMachine.updateState('WaitingForUser', { applicationReport });
               await eventLogger.info('JobPaused', `Application requires manual input for ${pendingFields.length} fields`, applicationReport);
            });
            
            return {
                status: 'WaitingForUser',
                completedFields,
                pendingFields,
                filledCount: completedFields.length,
                pendingCount: pendingFields.length,
                completionPercentage,
                report: applicationReport
            };
        }

        // Review & Submit
        await runStep('ReadyForSubmission', async () => {
             await connector.review();
        });
        
        await runStep('Submitting', async () => {
             await connector.submit();
        });

        await runStep('SubmissionVerification', async () => {
             await connector.verify();
        });
        
        await runStep('Completed', async () => {
             await connector.captureEvidence('Screenshot', 'Completed');
             await stateMachine.updateState('Completed', { applicationReport });
        });

        await telemetry.finalize(true);
        await eventLogger.info('JobCompleted', 'Application submitted successfully', applicationReport);

        return { 
            status: 'Completed',
            completedFields,
            pendingFields: [],
            filledCount: completedFields.length,
            pendingCount: 0,
            completionPercentage: 100,
            report: applicationReport
        };

      } catch (error) {
        logger.error(`Application Job Failed: ${error.message}`);
        await eventLogger.error('JobFailed', error.message, { stack: error.stack });
        
        if (error.name === 'ValidationError') {
          // Do not retry validation errors
          logger.warn(`ValidationError caught. Bypassing retries. Error: ${error.message}`);
          try {
             await stateMachine.updateState('Cancelled', null, error);
          } catch (e) {}
          await telemetry.finalize(false);
          return { success: false, error: error.message };
        }

        const canRetry = await stateMachine.incrementRetry();
        telemetry.recordRetry();

        if (canRetry) {
          // It's a transient error. Do NOT transition to Failed. 
          // We leave the state where it crashed so it can resume.
          logger.warn(`Transient error caught. Will retry from state ${stateMachine.session.status}. Error: ${error.message}`);
          throw error; // Let BullMQ retry
        } else {
          try {
             // Only attempt to set Failed if not already failed
             await stateMachine.updateState('Failed', null, error);
          } catch (e) {
             logger.warn(`Could not set status to Failed: ${e.message}`);
          }
          await telemetry.finalize(false);
          // Do not throw, since we exhausted retries.
        }
        
        return { success: false, error: error.message };

      } finally {
        // Cleanup
        let keepBrowserOpen = false;
        try {
            const currentState = (await stateMachine.load()).status;
            keepBrowserOpen = currentState === 'WaitingForUser' || currentState === 'CompletedWithWarnings';
        } catch (e) {}

        if (context) {
          try {
            const newSessionData = await new ContextManager(null).extractSessionData(context);
            const actualSessionId = (await SessionManager.getOrCreateSession(userId, connectorName)).sessionId;
            await SessionManager.saveSessionData(actualSessionId, newSessionData);
          } catch (err) {
            logger.error(`Failed to save session data: ${err.message}`);
          }
          if (!keepBrowserOpen) {
              await context.close().catch(() => {});
          } else {
              logger.info('Keeping browser context open for WaitingForUser');
          }
        }
        
        if (browser) {
            if (!keepBrowserOpen) {
                BrowserPool.release(browser, sessionId);
            } else {
                logger.info('Not releasing browser to pool; waiting for manual user intervention. Setting 15 min timeout.');
                // Add a 15-minute timeout to reclaim the browser if the user abandons it
                setTimeout(async () => {
                   try {
                       logger.warn(`15-minute intervention timeout reached for session ${sessionId}. Reclaiming browser.`);
                       if (context) await context.close().catch(() => {});
                       BrowserPool.release(browser, sessionId);
                   } catch (e) {}
                }, 15 * 60 * 1000);
            }
        }
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
