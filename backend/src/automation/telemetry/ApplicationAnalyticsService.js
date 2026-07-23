const ApplicationSession = require('../../models/ApplicationSession');
const DiscoveredJob = require('../../models/DiscoveredJob');
const logger = require('../../config/logger');

class ApplicationAnalyticsService {
  /**
   * Generates comprehensive SaaS analytics metrics for candidate job applications.
   * @param {string} [userId] - Optional Clerk userId filter
   * @returns {Promise<Object>} SaaS Analytics Summary
   */
  static async getAnalytics(userId = null) {
    logger.info(`[ApplicationAnalyticsService] Generating analytics metrics...`);
    const query = userId ? { userId } : {};

    const totalSessions = await ApplicationSession.countDocuments(query);
    const completedSessions = await ApplicationSession.countDocuments({ ...query, status: 'Completed' });
    const failedSessions = await ApplicationSession.countDocuments({ ...query, status: 'Failed' });
    const pausedSessions = await ApplicationSession.countDocuments({ ...query, status: 'WaitingForUser' });
    const cancelledSessions = await ApplicationSession.countDocuments({ ...query, status: 'Cancelled' });

    const overallSuccessRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

    // ATS-specific breakdown
    const atsBreakdown = await ApplicationSession.aggregate([
      ...(userId ? [{ $match: { userId } }] : []),
      {
        $group: {
          _id: '$connectorName',
          totalCount: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] }
          }
        }
      }
    ]);

    const atsMetrics = {};
    atsBreakdown.forEach(b => {
      const name = b._id || 'generic';
      atsMetrics[name] = {
        total: b.totalCount,
        completed: b.completedCount,
        failed: b.failedCount,
        successRate: b.totalCount > 0 ? Math.round((b.completedCount / b.totalCount) * 100) : 0
      };
    });

    const discoveredTotal = await DiscoveredJob.countDocuments();
    const autoAppliedTotal = await DiscoveredJob.countDocuments({ status: { $in: ['Queued', 'Applied'] } });

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalApplications: totalSessions,
        completedApplications: completedSessions,
        failedApplications: failedSessions,
        pausedForUserApplications: pausedSessions,
        cancelledApplications: cancelledSessions,
        overallSuccessRate: `${overallSuccessRate}%`
      },
      discovery: {
        totalJobsDiscovered: discoveredTotal,
        totalJobsAutoApplied: autoAppliedTotal
      },
      atsMetrics
    };
  }
}

module.exports = ApplicationAnalyticsService;
