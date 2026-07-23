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
const ActiveSessionRegistry = require('../browser/ActiveSessionRegistry');
const AutomationDiagnosticsReport = require('../telemetry/AutomationDiagnosticsReport');
const ATSConnectorFactory = require('../connectors/factory/ATSConnectorFactory');
const ATSDetectionEngine = require('../connectors/factory/ATSDetectionEngine');
const CandidateKnowledgeGraph = require('../engine/CandidateKnowledgeGraph');
const ResumeTailoringService = require('../engine/ResumeTailoringService');
const TelemetryManager = require('../telemetry/TelemetryManager');
const BrowserEventLogger = require('../telemetry/BrowserEventLogger');
const CandidateProfileResolver = require('../engine/CandidateProfileResolver');
const Job = require('../../models/Job');
const logger = require('../../config/logger');

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
      let browser, context, page, automationContext, connector;
      
      try {
        const startTime = Date.now();
        await eventLogger.info('JobStarted', `Worker started processing job for ${connectorName}`);
        
        // Load job details
        const targetJob = await Job.findById(jobId);
        if (!targetJob) throw new Error('Job not found in database');

        // Detect ATS dynamically if not provided or generic
        const detection = await ATSDetectionEngine.detect(targetJob.applyUrl);
        const resolvedATSKey = (connectorName && connectorName !== 'generic') ? connectorName : detection.atsKey;

        // Load session info
        const appSession = await stateMachine.load();
        
        if (appSession.status === 'Queued' || appSession.status === 'Created') {
            await stateMachine.updateState('WorkerAssigned');
        } else if (appSession.status === 'WaitingForUser') {
            await stateMachine.updateState('ReadyForSubmission');
        }
        
        const logStepProgress = (stateName) => {
            logger.info(`----------------------------------------`);
            logger.info(`Job: ${targetJob._id}`);
            logger.info(`Company: ${targetJob.company}`);
            logger.info(`ATS: ${resolvedATSKey}`);
            logger.info(`Connector: ${connector ? connector.constructor.name : 'Pending'}`);
            logger.info(`Worker: AutomationWorker`);
            logger.info(`Browser: Chromium`);
            logger.info(`State: ${stateName}`);
            logger.info(`----------------------------------------`);
        };

        const runStep = async (targetState, fn) => {
            if (stateMachine.shouldExecute(targetState)) {
                logStepProgress(targetState);
                await stateMachine.updateState(targetState);
                if (fn) await fn();
            }
        };

        // PHASE 1: Profile Loading & Validation (PLAYWRIGHT-FREE)
        let candidateKG;
        let profileData;
        await runStep('LoadingProfile', async () => {
            candidateKG = await CandidateKnowledgeGraph.loadForUser(userId);
            profileData = candidateKG.toNormalizedProfile();
            
            await eventLogger.info('ProfileNormalized', 'Candidate Profile Knowledge Graph loaded successfully', {
                educationCount: profileData.education?.length || 0,
                experienceCount: profileData.experience?.length || 0,
                hasDefaultResume: !!profileData.documents?.defaultResume,
                hasCoverLetter: profileData.documents?.coverLetters?.length > 0
            });

            const ApplicationSession = require('../../models/ApplicationSession');
            await ApplicationSession.findByIdAndUpdate(sessionId, { $set: { 'stateData.profileData': profileData } });
        });
        
        if (!profileData) {
          candidateKG = await CandidateKnowledgeGraph.loadForUser(userId);
          profileData = candidateKG.toNormalizedProfile();
        }

        // Tailor resume & assets for target job
        const tailoringResult = await ResumeTailoringService.tailorForJob(candidateKG, targetJob);
        if (tailoringResult.selectedResumePath) {
          profileData.documents.defaultResume = tailoringResult.selectedResumePath;
        }

        await runStep('ValidatingProfile', async () => {
            const validationReport = CandidateProfileResolver.validate(profileData);
            
            if (!validationReport.canContinue) {
                await eventLogger.error('ProfileValidationError', `Automation blocked. Critical fields missing: ${validationReport.criticalErrors.join(', ')}`);
                const error = new Error(`Profile is critically incomplete. Missing: ${validationReport.criticalErrors.join(', ')}`);
                error.name = 'ValidationError';
                throw error;
            }

            const ApplicationSession = require('../../models/ApplicationSession');
            await ApplicationSession.findByIdAndUpdate(sessionId, { $set: { 'stateData.validationReport': validationReport } });
        });

        // PHASE 2: Single Browser Acquisition & Active Session Reuse
        await runStep('BrowserStarting');
        
        if (ActiveSessionRegistry.has(sessionId)) {
            automationContext = ActiveSessionRegistry.get(sessionId);
            browser = automationContext.browser;
            context = automationContext.context;
            page = automationContext.page;
            automationContext.logOwnership('ResumedActiveSession', 'WorkerProcessor');
            logger.info(`[WorkerProcessor] Reusing active browser session for ${sessionId} without re-acquiring browser.`);
        } else {
            await runStep('BrowserReady', async () => {
                browser = await BrowserPool.acquire(sessionId);
                const contextManager = new ContextManager(browser);
                context = await contextManager.createContext();
                
                const browserSession = await SessionManager.getOrCreateSession(userId, resolvedATSKey);
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
                ActiveSessionRegistry.register(sessionId, automationContext);
            });
        }

        if (!automationContext) {
            browser = await BrowserPool.acquire(sessionId);
            const contextManager = new ContextManager(browser);
            context = await contextManager.createContext();
            const browserSession = await SessionManager.getOrCreateSession(userId, resolvedATSKey);
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
            ActiveSessionRegistry.register(sessionId, automationContext);
        }

        const browserSession = await SessionManager.getOrCreateSession(userId, resolvedATSKey);
        connector = ATSConnectorFactory.createConnector(resolvedATSKey, automationContext, browserSession);

        // Restore cached telemetry and execution state if resuming
        if (appSession.stateData?.completedFields) {
          connector.completedFields = appSession.stateData.completedFields || [];
        }
        if (appSession.stateData?.pendingFields) {
          connector.pendingFields = appSession.stateData.pendingFields || [];
        }
        if (appSession.stateData?.uploadResults) {
          connector.uploadResults = appSession.stateData.uploadResults || [];
        }

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
        
        const cachedReport = appSession.stateData?.diagnosticsReport || null;
        const diagnosticsReport = AutomationDiagnosticsReport.generate({
            sessionId,
            connectorName,
            automationContext,
            classificationReport: connector.formIntelligence?.classificationReport || cachedReport?.domIntelligenceReport || null,
            profileValidationReport: appSession.stateData?.validationReport || null,
            completedFields: completedFields.length > 0 ? completedFields : (cachedReport?.executionStats?.completedFields || []),
            pendingFields: pendingFields,
            uploadResults: connector.uploadResults?.length > 0 ? connector.uploadResults : (cachedReport?.uploadVerificationResults || []),
            executionTimeSeconds: executionTimeSec
        });

        // Cache diagnostics report & execution state in DB
        const ApplicationSession = require('../../models/ApplicationSession');
        await ApplicationSession.findByIdAndUpdate(sessionId, {
          $set: {
            'stateData.diagnosticsReport': diagnosticsReport,
            'stateData.completedFields': completedFields,
            'stateData.pendingFields': pendingFields,
            'stateData.uploadResults': connector.uploadResults
          }
        });

        if (pendingFields.length > 0) {
            await runStep('WaitingForUser', async () => {
               await eventLogger.info('JobPaused', `Application requires manual input for ${pendingFields.length} fields`, diagnosticsReport);
            });
            
            return {
                status: 'PAUSED',
                result: 'WaitingForUser',
                completedFields,
                pendingFields,
                filledCount: completedFields.length,
                pendingCount: pendingFields.length,
                completionPercentage,
                report: diagnosticsReport
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
        });

        await telemetry.finalize(true);
        await eventLogger.info('JobCompleted', 'Application submitted successfully', diagnosticsReport);

        return { 
            status: 'SUBMITTED',
            result: 'Completed',
            completedFields,
            pendingFields: [],
            filledCount: completedFields.length,
            pendingCount: 0,
            completionPercentage: 100,
            report: diagnosticsReport
        };

      } catch (error) {
        logger.error(`Application Job Error: ${error.message}`);
        await eventLogger.error('JobFailed', error.message, { stack: error.stack });
        
        const currentState = appSession?.status || 'Created';
        const nonRetryableStates = ['WaitingForUser', 'ReadyForSubmission', 'Completed', 'CompletedWithWarnings', 'Cancelled'];
        
        if (nonRetryableStates.includes(currentState)) {
          logger.warn(`Job in non-retryable state [${currentState}]. Suppressing retries.`);
          return { status: 'PAUSED', result: currentState, error: error.message };
        }

        if (error.name === 'ValidationError') {
          logger.warn(`ValidationError caught. Bypassing retries. Error: ${error.message}`);
          try {
             await stateMachine.updateState('Cancelled', null, error);
          } catch (e) {}
          await telemetry.finalize(false);
          return { status: 'CANCELLED', result: 'Cancelled', error: error.message };
        }

        const canRetry = await stateMachine.incrementRetry();
        telemetry.recordRetry();

        if (canRetry) {
          logger.warn(`Transient error caught. Will retry from state ${stateMachine.session.status}. Error: ${error.message}`);
          throw error; // Let BullMQ retry
        } else {
          try {
             await stateMachine.updateState('Failed', null, error);
          } catch (e) {
             logger.warn(`Could not set status to Failed: ${e.message}`);
          }
          await telemetry.finalize(false);
        }
        
        return { status: 'FAILED', result: 'Failed', error: error.message };

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
                ActiveSessionRegistry.unregister(sessionId);
                BrowserPool.release(browser, sessionId);
            } else {
                logger.info('Not releasing browser to pool; keeping session registered in ActiveSessionRegistry for user intervention.');
                setTimeout(async () => {
                   try {
                       logger.warn(`15-minute intervention timeout reached for session ${sessionId}. Reclaiming browser.`);
                       if (context) await context.close().catch(() => {});
                       ActiveSessionRegistry.unregister(sessionId);
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
