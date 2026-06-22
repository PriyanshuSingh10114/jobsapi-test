const Job = require('../models/Job');
const { syncAll } = require('../services/sync.service');
const { buildJobFilter } = require('../utils/filterBuilder');
const logger = require('../config/logger');

exports.getJobs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const query = buildJobFilter(req.query);

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
    const { sort } = req.query;

    const query = buildJobFilter(req.query);

    // Determine sort
    let sortOption = { postedAt: -1 }; // default Newest First
    if (sort === 'Oldest First') sortOption = { postedAt: 1 };
    else if (sort === 'Company Name') sortOption = { company: 1 };
    else if (sort === 'Remote First') sortOption = { remote: -1, postedAt: -1 };

    const startIndex = (page - 1) * limit;
    
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort(sortOption)
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

exports.getSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const regex = new RegExp(`^${q}`, 'i');
    
    // Get unique titles
    const titles = await Job.distinct('title', { title: regex }).exec();
    
    // Get unique companies
    const companies = await Job.distinct('company', { company: regex }).exec();

    // Combine and slice top 10
    const suggestions = [...new Set([...titles, ...companies])].slice(0, 10);

    res.json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
};
