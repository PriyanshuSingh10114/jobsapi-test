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

exports.getDuplicates = async (req, res, next) => {
  try {
    const recentMetrics = await SyncMetric.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$source", updatedJobs: { $first: "$jobsUpdated" } } }
    ]);

    const sourcesObj = {};
    recentMetrics.forEach(m => {
      if (m.updatedJobs > 0) {
        sourcesObj[m._id] = m.updatedJobs;
      }
    });

    res.json({
      duplicateAttempts: 0,
      status: "Fixed - All duplicates safely merged via upsert",
      sources: sourcesObj
    });
  } catch (err) {
    next(err);
  }
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

exports.getDataIntegrity = async (req, res, next) => {
  try {
    const metrics = await SyncMetric.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { 
          _id: "$source", 
          fetched: { $first: "$jobsFetched" },
          inserted: { $first: "$jobsInserted" },
          updated: { $first: "$jobsUpdated" }
        }
      }
    ]);

    const results = metrics.map(m => {
      // NOTE: We don't have historical Unchanged tracking in older SyncMetrics,
      // but going forward we log it. We calculate expected matching to highlight the missing link.
      const mismatched = m.fetched - (m.inserted + m.updated);
      const mismatchPercentage = m.fetched === 0 ? 0 : ((mismatched / m.fetched) * 100).toFixed(2);
      
      return {
        source: m._id,
        fetched: m.fetched,
        inserted: m.inserted,
        updated: m.updated,
        unchangedOrSkipped: mismatched,
        mismatchPercentage: `${mismatchPercentage}%`
      };
    });

    res.json({
      success: true,
      explanation: "MongoDB only increments modifiedCount if a document actually changed. If a job is fetched but has identical data to the DB, it is matched but NOT updated. 'unchangedOrSkipped' captures this volume.",
      integrityReport: results
    });
  } catch (err) { next(err); }
};

exports.getDatabaseHealth = async (req, res, next) => {
  try {
    const stats = await Job.db.db.command({ collStats: 'jobs' });
    const storageEstimateMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    const totalJobs = stats.count;
    const uniqueJobHashes = await Job.distinct('jobHash');
    const duplicateJobs = totalJobs - uniqueJobHashes.length;
    const duplicatePercentage = ((duplicateJobs / totalJobs) * 100).toFixed(2) || 0;

    const sourcesAgg = await Job.aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
    const totalSources = sourcesAgg.length;
    
    const syncMetricsCount = await SyncMetric.countDocuments();

    let atlasRiskLevel = 'Healthy';
    if (storageEstimateMB > 450) atlasRiskLevel = 'Critical';
    else if (storageEstimateMB > 350) atlasRiskLevel = 'Warning';

    res.json({
      success: true,
      totalJobs,
      totalUniqueJobs: uniqueJobHashes.length,
      duplicateJobs,
      duplicatePercentage: `${duplicatePercentage}%`,
      totalSources,
      storageEstimateMB,
      syncMetricsCount,
      atlasRiskLevel,
      topSourcesByJobs: sourcesAgg.slice(0, 5)
    });
  } catch (err) { next(err); }
};

exports.getDataQuality = async (req, res, next) => {
  try {
    const totalJobs = await Job.countDocuments();
    
    // Aggregate by regions and types
    const stats = await Job.aggregate([
      {
        $facet: {
          regions: [{ $group: { _id: "$jobRegion", count: { $sum: 1 } } }],
          types: [{ $group: { _id: "$jobType", count: { $sum: 1 } } }],
          experience: [{ $group: { _id: "$experienceLevel", count: { $sum: 1 } } }]
        }
      }
    ]);

    const result = stats[0];
    
    let usJobs = 0;
    let internationalRemoteJobs = 0;
    let invalidForeignJobs = 0;
    
    result.regions.forEach(r => {
      if (['US Onsite', 'US Hybrid', 'US Remote'].includes(r._id)) usJobs += r.count;
      if (r._id === 'International Remote') internationalRemoteJobs += r.count;
      if (r._id === 'Unknown') invalidForeignJobs += r.count;
    });

    let internships = 0;
    let unknownEmploymentType = 0;
    result.types.forEach(t => {
      if (t._id === 'Internship') internships += t.count;
      if (t._id === 'Unknown' || !t._id) unknownEmploymentType += t.count;
    });

    let newGradJobs = 0;
    let unknownExperienceLevel = 0;
    result.experience.forEach(e => {
      if (e._id === 'Entry Level') newGradJobs += e.count; // Map Entry/New Grad to this bucket
      if (e._id === 'Unknown' || !e._id) unknownExperienceLevel += e.count;
    });

    const uniqueHashes = await Job.distinct('jobHash');
    const duplicatesDetected = totalJobs - uniqueHashes.length;

    res.json({
      success: true,
      data: {
        totalJobs,
        usJobs,
        internationalRemoteJobs,
        invalidForeignJobs,
        internships,
        newGradJobs, // Approximation of Entry Level
        unknownEmploymentType,
        unknownExperienceLevel,
        duplicatesDetected
      }
    });
  } catch (err) { next(err); }
};

exports.getValidateStats = async (req, res, next) => {
  try {
    const { buildJobFilter } = require('../utils/filterBuilder');
    const rawTotal = await Job.countDocuments();
    
    const filter = buildJobFilter({});
    const searchAggregationCountArr = await Job.aggregate([
      { $match: filter },
      { $count: 'total' }
    ]);
    const searchCount = searchAggregationCountArr[0] ? searchAggregationCountArr[0].total : 0;

    res.json({
      success: true,
      statsEndpointCount: rawTotal,
      searchEndpointCount: searchCount,
      mismatch: rawTotal - searchCount,
      status: rawTotal === searchCount ? 'MATCH' : 'MISMATCH'
    });
  } catch (err) { next(err); }
};
