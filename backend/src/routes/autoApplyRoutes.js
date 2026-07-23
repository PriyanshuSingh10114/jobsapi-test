const express = require('express');
const router = express.Router();
const AutoApplyEngine = require('../automation/discovery/AutoApplyEngine');

// Trigger continuous auto-apply cycle for user
router.post('/run', async (req, res) => {
  try {
    const { userId, minScore = 75, limit = 5 } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const result = await AutoApplyEngine.runAutoApplyCycle(userId, { minScore: Number(minScore), limit: Number(limit) });
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
