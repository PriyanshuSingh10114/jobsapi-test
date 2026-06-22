const Job = require('../models/Job');

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
