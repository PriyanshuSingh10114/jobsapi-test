const Job = require('../models/Job');
const Source = require('../models/Source');
const { buildJobFilter } = require('../utils/filterBuilder');
const logger = require('../config/logger');

exports.getStats = async (req, res, next) => {
  try {
    const baseFilter = buildJobFilter({});
    const totalJobs = await Job.countDocuments(baseFilter);
    const remoteJobs = await Job.countDocuments({ ...baseFilter, remote: true });
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    
    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const [newJobsToday, jobsAddedThisWeek, uniqueCompanies, latestSources] = await Promise.all([
      Job.countDocuments({ ...baseFilter, postedAt: { $gte: startOfToday } }),
      Job.countDocuments({ ...baseFilter, postedAt: { $gte: startOfWeek } }),
      Job.distinct('company', baseFilter),
      Source.find().sort({ lastSync: -1 }).limit(1).lean()
    ]);

    const totalCompanies = uniqueCompanies.length;
    const lastSyncTime = latestSources.length > 0 ? latestSources[0].lastSync : null;

    // Top Hiring States
    const topStates = await Job.aggregate([
      { $match: { state: { $ne: null, $nin: ['', 'Unknown'] }, ...baseFilter } },
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
