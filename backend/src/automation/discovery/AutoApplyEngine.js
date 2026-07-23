const DiscoveredJob = require('../../models/DiscoveredJob');
const Job = require('../../models/Job');
const { AutomationWorkerQueue } = require('../workers/AutomationWorkerQueue');
const CandidateKnowledgeGraph = require('../engine/CandidateKnowledgeGraph');
const logger = require('../../config/logger');

class AutoApplyEngine {
  /**
   * Automatically selects, queues, and applies to high-match jobs for a candidate.
   * @param {string} userId - Candidate Clerk ID
   * @param {Object} options - Filtering options { minScore, limit, forceApply }
   * @returns {Promise<Object>} Auto Apply Summary
   */
  static async runAutoApplyCycle(userId, options = {}) {
    const minScore = options.minScore || 75;
    const limit = options.limit || 5;
    logger.info(`[AutoApplyEngine] Starting Auto-Apply cycle for user: ${userId} (Min Score: ${minScore}, Limit: ${limit})`);

    const kg = await CandidateKnowledgeGraph.loadForUser(userId);
    const eligibleJobs = await DiscoveredJob.find({
      status: 'Discovered',
      matchScore: { $gte: minScore }
    }).sort({ matchScore: -1 }).limit(limit);

    const queuedSessions = [];

    for (const discJob of eligibleJobs) {
      try {
        // Ensure job exists in main Job model for worker execution
        let targetJob = await Job.findOne({ applyUrl: discJob.applyUrl });
        if (!targetJob) {
          targetJob = await Job.create({
            title: discJob.title,
            company: discJob.companyName,
            location: discJob.location,
            applyUrl: discJob.applyUrl,
            source: discJob.atsName || 'AutoApplyEngine',
            description: discJob.description
          });
        }

        // Enqueue job execution
        const session = await AutomationWorkerQueue.enqueueJob(targetJob._id.toString(), userId, discJob.atsKey);
        
        discJob.status = 'Queued';
        await discJob.save();

        queuedSessions.push({
          jobId: targetJob._id,
          title: discJob.title,
          company: discJob.companyName,
          atsKey: discJob.atsKey,
          sessionId: session._id
        });
      } catch (err) {
        logger.error(`[AutoApplyEngine] Failed to queue job ${discJob.title}: ${err.message}`);
        discJob.status = 'Failed';
        await discJob.save().catch(() => {});
      }
    }

    return {
      userId,
      processedCount: eligibleJobs.length,
      queuedSessions,
      status: 'Success'
    };
  }
}

module.exports = AutoApplyEngine;
