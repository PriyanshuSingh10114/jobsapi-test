const express = require('express');
const router = express.Router();
const JobDiscoveryEngine = require('../automation/discovery/JobDiscoveryEngine');
const DiscoveredJob = require('../models/DiscoveredJob');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const { parsePagination } = require('../utils/sanitizer');

// Ingest discovered jobs (Protected)
router.post('/ingest', authenticate, authorize('ADMIN', 'SYSTEM'), validate(schemas.discoveryIngest), async (req, res, next) => {
  try {
    const { jobs } = req.body;
    const processed = await JobDiscoveryEngine.ingestJobs(jobs);
    res.json({ success: true, count: processed.length, jobs: processed });
  } catch (err) {
    next(err);
  }
});

// List discovered jobs
router.get('/jobs', authenticate, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, 50, 100);
    const { status } = req.query;
    const query = status ? { status: String(status) } : {};

    const [total, jobs] = await Promise.all([
      DiscoveredJob.countDocuments(query),
      DiscoveredJob.find(query)
        .sort({ matchScore: -1, createdAt: -1 })
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
      jobs
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
