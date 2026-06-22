const Job = require('../models/Job');
const Source = require('../models/Source');
const { buildJobFilter } = require('../utils/filterBuilder');
const logger = require('../config/logger');

exports.getStats = async (req, res, next) => {
  try {
    const baseFilter = buildJobFilter({});
    const totalJobs = await Job.countDocuments(baseFilter);
    const searchFilterRaw = await Job.countDocuments(); // Raw count for log
    
    logger.info(`Stats Validation -> Base Count: ${totalJobs}, Raw Total DB Count: ${searchFilterRaw}`);

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

    // 1. Fastest Growing Roles (Current Week vs Previous Week)
    const roles = ['Software Engineer', 'Data Scientist', 'ML Engineer', 'DevOps', 'Product Manager', 'Frontend', 'Backend'];
    const fastestGrowingRoles = [];
    for (const role of roles) {
      const regex = new RegExp(role, 'i');
      const currentWeekCount = await Job.countDocuments({ title: { $regex: regex }, postedAt: { $gte: startOfWeek } });
      const priorWeekCount = await Job.countDocuments({ title: { $regex: regex }, postedAt: { $gte: priorWeekStart, $lt: startOfWeek } });
      
      let growth = 0;
      if (priorWeekCount > 0) {
        growth = ((currentWeekCount - priorWeekCount) / priorWeekCount) * 100;
      } else if (currentWeekCount > 0) {
        growth = 100; // infinite growth normalized
      }
      fastestGrowingRoles.push({ _id: role, currentWeekCount, priorWeekCount, growth: Math.round(growth) });
    }
    fastestGrowingRoles.sort((a, b) => b.growth - a.growth);

    // 2. Hiring Velocity (Companies adding most jobs recently)
    const hiringVelocity = await Job.aggregate([
      { $match: { postedAt: { $gte: startOfMonth } } },
      { $group: { _id: "$company", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 3. Most In-Demand Skills
    const inDemandSkills = await Job.aggregate([
      { $match: { skills: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$skills" },
      { $group: { _id: "$skills", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 }
    ]);

    // 4. Top Hiring States
    const topStates = await Job.aggregate([
      { $match: { state: { $ne: null } } },
      { $group: { _id: "$state", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 5. Remote Hiring Leaders
    const topRemoteCompanies = await Job.aggregate([
      { $match: { remote: true } },
      { $group: { _id: "$company", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 6. ATS Market Share
    const atsShare = await Job.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 7. Salary Insights
    const salaryInsights = [];
    for (const role of roles) {
      const regex = new RegExp(role, 'i');
      const salaryAgg = await Job.aggregate([
        { $match: { title: { $regex: regex }, "salary.average": { $exists: true, $ne: null } } },
        { $group: { _id: null, avgSalary: { $avg: "$salary.average" }, count: { $sum: 1 } } }
      ]);
      if (salaryAgg.length > 0 && salaryAgg[0].count > 0) {
        salaryInsights.push({
          _id: role,
          avgSalary: Math.round(salaryAgg[0].avgSalary),
          dataPoints: salaryAgg[0].count
        });
      }
    }
    salaryInsights.sort((a, b) => b.avgSalary - a.avgSalary);

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
          fastestGrowingRoles: fastestGrowingRoles.slice(0, 5),
          hiringVelocity,
          inDemandSkills,
          topStates,
          topRemoteCompanies,
          atsShare,
          salaryInsights,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
