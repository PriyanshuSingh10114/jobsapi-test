const Job = require('../models/Job');
const Source = require('../models/Source');

exports.getStats = async (req, res, next) => {
  try {
    const totalJobs = await Job.countDocuments();
    
    const uniqueCompanies = await Job.distinct('company');
    const totalCompanies = uniqueCompanies.length;

    const remoteJobsCount = await Job.countDocuments({ remote: true });
    
    const fullTimeJobs = await Job.countDocuments({ jobType: { $regex: /full[\s-]?time/i } });
    const internships = await Job.countDocuments({ jobType: { $regex: /intern/i } });

    const sources = await Source.find().sort({ lastSync: -1 }).limit(1);
    const lastSyncTime = sources.length > 0 ? sources[0].lastSync : null;

    // Aggregations for Insights
    const topCompanies = await Job.aggregate([
      { $group: { _id: "$company", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const topLocations = await Job.aggregate([
      { $match: { location: { $ne: 'Unknown' } } },
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const jobsBySource = await Job.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const jobsByType = await Job.aggregate([
      { $group: { _id: "$jobType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalJobs,
        totalCompanies,
        remoteJobs: remoteJobsCount,
        fullTimeJobs,
        internships,
        lastSyncTime,
        insights: {
          topCompanies,
          topLocations,
          jobsBySource,
          jobsByType
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
