const mongoose = require('mongoose');
const Job = require('../models/Job');
const Source = require('../models/Source');
const SyncMetric = require('../models/SyncMetric');
const { parsePagination } = require('../utils/sanitizer');

exports.getHealth = async (req, res, next) => {
  try {
    let totalJobs = 0;
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected) {
      totalJobs = await Job.countDocuments({ is_active: true });
    }
    res.json({
      success: true,
      data: {
        status: isDbConnected ? 'Healthy' : 'Connecting',
        totalActiveJobs: totalJobs,
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};


exports.getConnectors = async (req, res, next) => {
  try {
    const connectors = await Source.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: connectors });
  } catch (error) {
    next(error);
  }
};

exports.getSyncHistory = async (req, res, next) => {
  try {
    const { limit, skip } = parsePagination(req.query, 50, 200);
    const history = await SyncMetric.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};

exports.getMetrics = async (req, res, next) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$source",
          totalJobsInserted: { $sum: "$jobsInserted" },
          totalJobsUpdated: { $sum: "$jobsUpdated" },
          totalJobsFetched: { $sum: "$jobsFetched" },
          averageDurationMs: { $avg: "$durationMs" }
        }
      }
    ];
    const metrics = await SyncMetric.aggregate(pipeline);
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

exports.getFailures = async (req, res, next) => {
  try {
    const failedConnectors = await Source.find({ status: 'Failed' }).lean();
    res.json({ success: true, data: failedConnectors });
  } catch (error) {
    next(error);
  }
};

exports.getSkipped = async (req, res, next) => {
  try {
    const skippedData = await Source.find({}, 'name jobs_skipped').sort({ jobs_skipped: -1 }).lean();
    res.json({ success: true, data: skippedData });
  } catch (error) {
    next(error);
  }
};
