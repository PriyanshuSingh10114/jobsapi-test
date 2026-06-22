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
    const { role, location, company, jobType, experienceLevel, remote, source, datePosted, sort, jobRegion, skills } = req.query;

    const query = {};
    const andConditions = [];

    // Job Region Filtering
    if (jobRegion && jobRegion !== 'All Jobs') {
      if (jobRegion === 'US Jobs') {
        andConditions.push({ jobRegion: { $in: ['US Onsite', 'US Hybrid', 'US Remote'] } });
      } else {
        andConditions.push({ jobRegion });
      }
    } else if (!jobRegion) {
      // Default to US Jobs if no parameter is provided
      andConditions.push({ jobRegion: { $in: ['US Onsite', 'US Hybrid', 'US Remote'] } });
    }

    // Use text search for role and skills
    let textSearchStr = '';
    if (role) textSearchStr += role + ' ';
    if (skills) textSearchStr += skills;
    
    if (textSearchStr.trim()) {
      query.$text = { $search: textSearchStr.trim() };
    }

    if (company) {
      andConditions.push({ company: { $regex: new RegExp(company, 'i') } });
    }

    if (location) {
      andConditions.push({ location: { $regex: new RegExp(location, 'i') } });
    }

    if (jobType) {
      const parsedJobType = jobType.replace(/-/g, ' ');
      andConditions.push({
        $or: [
          { jobType: { $regex: new RegExp(parsedJobType, 'i') } },
          { title: { $regex: new RegExp(parsedJobType, 'i') } }
        ]
      });
    }

    if (experienceLevel) {
      andConditions.push({ experienceLevel: { $regex: new RegExp(experienceLevel, 'i') } });
    }

    if (remote === 'true') {
      andConditions.push({ remote: true });
    }

    if (source) {
      andConditions.push({ source: { $regex: new RegExp(`^${source}$`, 'i') } });
    }

    if (datePosted) {
      const date = new Date();
      if (datePosted === 'Past 24 hours') {
        date.setDate(date.getDate() - 1);
        andConditions.push({ postedAt: { $gte: date } });
      } else if (datePosted === 'Past Week') {
        date.setDate(date.getDate() - 7);
        andConditions.push({ postedAt: { $gte: date } });
      } else if (datePosted === 'Past Month') {
        date.setMonth(date.getMonth() - 1);
        andConditions.push({ postedAt: { $gte: date } });
      }
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

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
