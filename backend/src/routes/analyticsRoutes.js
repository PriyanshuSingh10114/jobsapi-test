const express = require('express');
const router = express.Router();
const ApplicationAnalyticsService = require('../automation/telemetry/ApplicationAnalyticsService');

// Get SaaS telemetry dashboard analytics
router.get('/dashboard', async (req, res) => {
  try {
    const { userId } = req.query;
    const analytics = await ApplicationAnalyticsService.getAnalytics(userId || null);
    res.json({ success: true, analytics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
