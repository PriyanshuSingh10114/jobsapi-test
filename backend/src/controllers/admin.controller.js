const Job = require('../models/Job');
const Source = require('../models/Source');
const SyncMetric = require('../models/SyncMetric');

exports.getHealth = async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments({ is_active: true });
    const dbStatus = 'Healthy'; // Assuming mongoose is connected if count works
    res.json({
      success: true,
      data: {
        status: dbStatus,
        totalActiveJobs: totalJobs,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getConnectors = async (req, res) => {
  try {
    const connectors = await Source.find().sort({ name: 1 });
    res.json({ success: true, data: connectors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSyncHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await SyncMetric.find().sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMetrics = async (req, res) => {
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
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getFailures = async (req, res) => {
  try {
    const failedConnectors = await Source.find({ status: 'Failed' });
    res.json({ success: true, data: failedConnectors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSkipped = async (req, res) => {
  try {
    const skippedData = await Source.find({}, 'name jobs_skipped').sort({ jobs_skipped: -1 });
    res.json({ success: true, data: skippedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
