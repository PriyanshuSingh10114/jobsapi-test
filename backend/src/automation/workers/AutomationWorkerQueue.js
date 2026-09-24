const { Queue } = require('bullmq');
const ApplicationSession = require('../../models/ApplicationSession');
const config = require('../../config');
const { ConflictError } = require('../../errors/AppErrors');
const logger = require('../../config/logger');

let queueInstance = null;

function getApplicationQueue() {
  if (!queueInstance) {
    queueInstance = new Queue('JobApplications', {
      connection: {
        host: config.REDIS.host,
        port: config.REDIS.port,
        password: config.REDIS.password,
        maxRetriesPerRequest: config.REDIS.maxRetriesPerRequest,
        lazyConnect: true
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: {
          count: 1000,
          age: 24 * 3600
        },
        removeOnFail: {
          count: 2000,
          age: 7 * 24 * 3600
        }
      }
    });
  }
  return queueInstance;
}

class AutomationWorkerQueue {
  /**
   * Enqueues an automated application job with deterministic idempotency guards.
   */
  static async enqueueJob(jobId, userId, connectorName) {
    // 1. Idempotency Check: Prevent duplicate in-flight or completed applications
    const activeSession = await ApplicationSession.findOne({
      jobId,
      userId,
      status: { 
        $in: [
          'Created', 'Queued', 'WorkerAssigned', 'LoadingProfile', 
          'ValidatingProfile', 'BrowserStarting', 'BrowserReady', 
          'OpeningJob', 'AnalyzingForm', 'FillingFields', 
          'WaitingForUser', 'ReadyForSubmission', 'Submitting', 'Completed'
        ] 
      }
    });

    if (activeSession) {
      if (activeSession.status === 'Completed') {
        throw new ConflictError('You have already successfully applied to this job posting.', {
          sessionId: activeSession._id,
          completedAt: activeSession.completedAt
        });
      }

      logger.warn(`[AutomationWorkerQueue] Active application session already exists for job ${jobId} and user ${userId}: status=${activeSession.status}`);
      return activeSession;
    }

    // 2. Create New ApplicationSession Document
    const session = await ApplicationSession.create({
      jobId,
      userId,
      connectorName,
      status: 'Created',
      stateData: {}
    });

    // 3. Enqueue into BullMQ with deterministic Job ID (bypassed gracefully in test mode if Redis offline)
    if (!config.SERVER.isTest) {
      const queue = getApplicationQueue();
      const bullJobId = `apply_${userId}_${jobId}_${session._id}`;
      await queue.add('apply', {
        sessionId: session._id.toString(),
        jobId: jobId.toString(),
        userId,
        connectorName
      }, {
        jobId: bullJobId
      });
      logger.info(`[AutomationWorkerQueue] Enqueued application job ${bullJobId} for session ${session._id}`);
    }

    session.status = 'Queued';
    await session.save();

    return session;
  }

  static async closeQueue() {
    if (queueInstance) {
      await queueInstance.close();
      queueInstance = null;
    }
  }
}

module.exports = {
  AutomationWorkerQueue,
  get applicationQueue() {
    return getApplicationQueue();
  }
};
