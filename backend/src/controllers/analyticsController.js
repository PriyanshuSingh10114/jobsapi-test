const Job = require('../models/Job');
const { buildJobFilter } = require('../utils/filterBuilder');
const logger = require('../config/logger');

// GET /api/analytics/sources
exports.getSources = async (req, res, next) => {
  try {
    const baseFilter = buildJobFilter({});
    const sources = await Job.aggregate([
      { $match: { source: { $ne: null, $nin: ['', 'Unknown'] }, ...baseFilter } },
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
