const express = require('express');
const router = express.Router();
const AutoApplyEngine = require('../automation/discovery/AutoApplyEngine');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const { automationRateLimiter } = require('../middleware/rateLimiter');

// Trigger continuous auto-apply cycle for user
router.post('/run', authenticate, automationRateLimiter, validate(schemas.autoApplyRun), async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.body.userId;
    const { minScore = 75, limit = 5 } = req.body;

    const result = await AutoApplyEngine.runAutoApplyCycle(userId, {
      minScore: Number(minScore),
      limit: Number(limit)
    });
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
