const { Queue } = require('bullmq');
const ApplicationSession = require('../../models/ApplicationSession');

// Initialize queue
const applicationQueue = new Queue('JobApplications', {
  connection: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  }
});

class AutomationWorkerQueue {
  static async enqueueJob(jobId, userId, connectorName) {
    // Create DB Session
    const session = await ApplicationSession.create({
      jobId,
      userId,
      connectorName,
      status: 'Created',
      stateData: {}
    });

    // Add to Queue
    await applicationQueue.add('apply', {
      sessionId: session._id.toString(),
      jobId,
      userId,
      connectorName
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });

    session.status = 'Queued';
    await session.save();

    return session;
  }
}

module.exports = { AutomationWorkerQueue, applicationQueue };
