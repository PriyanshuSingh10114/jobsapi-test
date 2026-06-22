const Job = require('../models/Job');
const Source = require('../models/Source');
const SyncMetric = require('../models/SyncMetric');

exports.getHealth = async (req, res, next) => {
  try {
    const totalJobs = await Job.countDocuments();
    
    // Check duplicates by applyUrl quickly
    const duplicates = await Job.aggregate([
      { $group: { _id: '$applyUrl', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: "totalDuplicates" }
    ]);
    const duplicateCount = duplicates.length > 0 ? duplicates[0].totalDuplicates : 0;

    // Get DB Storage
    const stats = await Job.db.db.command({ collStats: 'jobs' });
    const storageUsedMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));

    // Get source health
    const sourcesData = await Source.find().lean();
    
    // Attach latest metrics to sources
    const sources = await Promise.all(sourcesData.map(async (src) => {
      const latestMetric = await SyncMetric.findOne({ source: src.name }).sort({ createdAt: -1 });
      return {
        name: src.name,
        status: src.status || 'unknown',
        lastSync: src.lastSync,
        jobs: src.jobCount || 0,
        lastError: src.lastError,
        latestRun: latestMetric ? {
          fetched: latestMetric.jobsFetched,
          inserted: latestMetric.jobsInserted,
          updated: latestMetric.jobsUpdated,
          duration: latestMetric.duration
        } : null
      };
    }));

    res.json({
      success: true,
      data: {
        totalJobs,
        duplicates: duplicateCount,
        storageUsedMB,
        sources
      }
    });

  } catch (error) {
    next(error);
  }
};
