const Job = require('../models/Job');
const { syncAll } = require('../services/sync.service');
const { buildJobFilter } = require('../utils/filterBuilder');
const { getRoleRegexPattern } = require('../utils/roleNormalizer');
const { escapeRegex, parsePagination } = require('../utils/sanitizer');
const logger = require('../config/logger');

exports.getJobs = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, 20, 100);
    const query = buildJobFilter(req.query);

    const [total, jobs] = await Promise.all([
      Job.countDocuments(query),
      Job.find(query)
        .sort({ postedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
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
    const { page, limit, skip } = parsePagination(req.query, 20, 100);
    const { sort, role } = req.query;

    const query = buildJobFilter(req.query);

    // Determine sort option
    let sortOption = { postedAt: -1 };
    if (sort === 'Oldest First') sortOption = { postedAt: 1 };
    else if (sort === 'Company Name') sortOption = { company: 1 };
    else if (sort === 'Remote First') sortOption = { remote: -1, postedAt: -1 };
    else if (sort === 'Most Relevant') sortOption = { relevanceScore: -1, postedAt: -1 };

    const total = await Job.countDocuments(query);
    let jobs;

    if (role) {
      const regexPattern = getRoleRegexPattern(String(role));
      const literalRole = escapeRegex(String(role).trim());

      const pipeline = [
        { $match: { ...query, $text: { $search: literalRole } } },
        {
          $addFields: {
            relevanceScore: {
              $switch: {
                branches: [
                  { case: { $regexMatch: { input: "$title", regex: `^${literalRole}$`, options: 'i' } }, then: 100 },
                  { case: { $regexMatch: { input: "$title", regex: `^${literalRole}`, options: 'i' } }, then: 90 },
                  { case: { $regexMatch: { input: "$title", regex: `\\b(${regexPattern})\\b`, options: 'i' } }, then: 80 },
                  { case: { $regexMatch: { input: "$title", regex: regexPattern, options: 'i' } }, then: 50 }
                ],
                default: 10
              }
            }
          }
        },
        { $sort: (!sort) ? { relevanceScore: -1, postedAt: -1 } : sortOption },
        { $skip: skip },
        { $limit: limit }
      ];
      
      jobs = await Job.aggregate(pipeline);
    } else {
      jobs = await Job.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean();
    }

    res.json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
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
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const escapedQuery = escapeRegex(q.trim());
    const regex = new RegExp(`^${escapedQuery}`, 'i');
    
    const [titles, companies] = await Promise.all([
      Job.distinct('title', { title: regex, is_active: true }).exec(),
      Job.distinct('company', { company: regex, is_active: true }).exec()
    ]);

    const suggestions = [...new Set([...titles, ...companies])].slice(0, 10);
    res.json({ success: true, data: suggestions });
  } catch (error) {
    next(error);
  }
};

exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

