const express = require('express');
const router = express.Router();
const JobDiscoveryEngine = require('../automation/discovery/JobDiscoveryEngine');
const DiscoveredJob = require('../models/DiscoveredJob');

// Ingest discovered jobs
router.post('/ingest', async (req, res) => {
  try {
    const { jobs } = req.body;
    if (!jobs || !Array.isArray(jobs)) {
      return res.status(400).json({ error: 'Body must contain a "jobs" array' });
    }
    const processed = await JobDiscoveryEngine.ingestJobs(jobs);
    res.json({ success: true, count: processed.length, jobs: processed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List discovered jobs
router.get('/jobs', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const query = status ? { status } : {};
    const jobs = await DiscoveredJob.find(query).sort({ matchScore: -1, createdAt: -1 }).limit(Number(limit));
    res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
