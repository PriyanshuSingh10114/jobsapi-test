const SyncMetric = require('../models/SyncMetric');
const Job = require('../models/Job');

exports.getPerformance = async (req, res, next) => {
  try {
    const metrics = await SyncMetric.find().sort({ createdAt: -1 }).limit(100);
    if (!metrics.length) return res.json({ message: "No metrics available" });

    const recentMetrics = metrics.slice(0, 20); // Analyzing most recent run across sources roughly
    
    // Calculate average duration across all sources
    const avgDuration = recentMetrics.reduce((acc, m) => acc + m.durationMs, 0) / recentMetrics.length;
    
    const sorted = [...recentMetrics].sort((a, b) => b.durationMs - a.durationMs);
    const slowestSource = sorted[0];
    const fastestSource = sorted[sorted.length - 1];
    
    res.json({
      averageSyncTime: `${(avgDuration / 1000).toFixed(1)}s per source`,
      slowestSource: `${slowestSource.source} (${slowestSource.duration})`,
      fastestSource: `${fastestSource.source} (${fastestSource.duration})`,
      lastSync: slowestSource.createdAt,
      recentMetrics
    });
  } catch (err) { next(err); }
};

exports.getCount = async (req, res, next) => {
  try {
    const totalJobs = await Job.countDocuments();
    const uniqueCompanies = await Job.distinct('company');
    const totalCompanies = uniqueCompanies.length;
    
    const sourceCounts = await Job.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } }
    ]);
    const bySource = {};
    sourceCounts.forEach(c => bySource[c._id] = c.count);
    
    res.json({ totalJobs, totalCompanies, bySource });
  } catch (err) { next(err); }
};

exports.getSources = async (req, res, next) => {
  try {
    const counts = await Job.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 } } }
    ]);
    const formatted = {};
    counts.forEach(c => formatted[c._id.toLowerCase()] = c.count);
    res.json(formatted);
  } catch (err) { next(err); }
};

exports.getJobTypes = async (req, res, next) => {
  try {
    const counts = await Job.aggregate([
      { $group: { _id: "$jobType", count: { $sum: 1 } } }
    ]);
    res.json(counts);
  } catch (err) { next(err); }
};

exports.getJobRegions = async (req, res, next) => {
  try {
    const counts = await Job.aggregate([
      { $group: { _id: "$jobRegion", count: { $sum: 1 } } }
    ]);
    res.json(counts);
  } catch (err) { next(err); }
};

exports.getCompanies = async (req, res, next) => {
  try {
    const counts = await Job.aggregate([
      { $group: { _id: "$company", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(counts);
  } catch (err) { next(err); }
};

exports.getLocations = async (req, res, next) => {
  try {
    const counts = await Job.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(counts);
  } catch (err) { next(err); }
};
