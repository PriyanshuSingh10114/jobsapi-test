const Job = require('../models/Job');
const logger = require('../config/logger');

// Global 30-Day Expiration Date
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

// US-First & Expiration Filter Rule
const activeUsFilter = {
  postedAt: { $gte: thirtyDaysAgo },
  isUSJob: true
};

// GET /api/analytics/sources
exports.getSources = async (req, res, next) => {
  try {
    const sources = await Job.aggregate([
      { $match: { source: { $ne: null }, ...activeUsFilter } },
      {
        $group: {
          _id: "$source",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const mappedSources = sources.map(s => ({
      source: s._id,
      count: s.count
    }));

    res.json({
      success: true,
      data: mappedSources
    });
  } catch (error) {
    logger.error(`Error in getSources: ${error.message}`);
    next(error);
  }
};
