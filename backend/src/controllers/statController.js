const Job = require('../models/Job');
const Source = require('../models/Source');
const { buildJobFilter } = require('../utils/filterBuilder');
const logger = require('../config/logger');

exports.getStats = async (req, res, next) => {
  try {
    const baseFilter = buildJobFilter({});
    const totalJobs = await Job.countDocuments(baseFilter);
    const searchFilterRaw = await Job.countDocuments(); // Raw count for log
    
    logger.info(`Stats Count: ${totalJobs}`);

    const remoteJobs = await Job.countDocuments({ ...baseFilter, remote: true });
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    
    const priorWeekStart = new Date(startOfWeek);
    priorWeekStart.setDate(startOfWeek.getDate() - 7);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const newJobsToday = await Job.countDocuments({ postedAt: { $gte: startOfToday } });
    const jobsAddedThisWeek = await Job.countDocuments({ postedAt: { $gte: startOfWeek } });
    const jobsAddedThisMonth = await Job.countDocuments({ postedAt: { $gte: startOfMonth } });
    
    const uniqueCompanies = await Job.distinct('company');
    const totalCompanies = uniqueCompanies.length;

    const sources = await Source.find().sort({ lastSync: -1 }).limit(1);
    const lastSyncTime = sources.length > 0 ? sources[0].lastSync : null;

    // Global 30-Day Expiration Date
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsFilter = {
      postedAt: { $gte: thirtyDaysAgo },
      isUSJob: true
    };

    // 4. Top Hiring States
    const topStates = await Job.aggregate([
      { $match: { state: { $ne: null }, ...activeUsFilter } },
      { $group: { _id: "$state", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalJobs,
        totalCompanies,
        remoteJobs,
        newJobsToday,
        jobsAddedThisWeek,
        lastSyncTime,
        insights: {
          topStates
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
