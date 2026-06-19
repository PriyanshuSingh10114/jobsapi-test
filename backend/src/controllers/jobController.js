const Job = require('../models/Job');
const { syncAll } = require('../services/sync.service');
const logger = require('../config/logger');

exports.getJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const source = req.query.source;
    const remote = req.query.remote;

    const query = {};
    if (source) query.source = source;
    if (remote !== undefined) query.remote = remote === 'true';

    const startIndex = (page - 1) * limit;
    
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ postedAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: jobs
    });
  } catch (error) {
    next(error);
  }
};

exports.syncJobs = async (req, res, next) => {
  try {
    logger.info('Manual sync triggered via API');
    const results = await syncAll();
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

exports.searchJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { role, location, jobType, remote } = req.query;

    const query = {};
    const andConditions = [];

    if (role) {
      const roleRegex = new RegExp(role, 'i');
      andConditions.push({
        $or: [
          { title: { $regex: roleRegex } },
          { description: { $regex: roleRegex } },
          { company: { $regex: roleRegex } }
        ]
      });
    }

    if (jobType) {
      const parsedJobType = jobType.replace(/-/g, ' ');
      const typeRegex = new RegExp(parsedJobType, 'i');
      andConditions.push({
        $or: [
          { title: { $regex: typeRegex } },
          { description: { $regex: typeRegex } }
        ]
      });
    }

    if (location) {
      andConditions.push({ location: { $regex: new RegExp(location, 'i') } });
    }

    if (remote === 'true') {
      andConditions.push({ remote: true });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const startIndex = (page - 1) * limit;
    
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ postedAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: jobs
    });
  } catch (error) {
    next(error);
  }
};
