const Job = require('../models/Job');
const Source = require('../models/Source');

exports.getStats = async (req, res, next) => {
  try {
    const totalJobs = await Job.countDocuments();
    
    const uniqueCompanies = await Job.distinct('company');
    const totalCompanies = uniqueCompanies.length;

    const remoteJobsCount = await Job.countDocuments({ remote: true });

    const sources = await Source.find().sort({ lastSync: -1 }).limit(1);
    const lastSyncTime = sources.length > 0 ? sources[0].lastSync : null;

    res.json({
      success: true,
      data: {
        totalJobs,
        totalCompanies,
        remoteJobs: remoteJobsCount,
        lastSyncTime
      }
    });
  } catch (error) {
    next(error);
  }
};
