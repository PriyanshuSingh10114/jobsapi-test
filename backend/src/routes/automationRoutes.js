const express = require('express');
const router = express.Router();
const { AutomationWorkerQueue } = require('../automation/workers/AutomationWorkerQueue');
const ApplicationSession = require('../models/ApplicationSession');
const AutomationLog = require('../models/AutomationLog');
const { authenticate } = require('../middleware/auth');
const { validate, validateObjectId, schemas } = require('../middleware/validator');
const { automationRateLimiter } = require('../middleware/rateLimiter');
const { NotFoundError } = require('../errors/AppErrors');

// POST /api/automation/start
router.post('/start', authenticate, automationRateLimiter, validate(schemas.automationStart), async (req, res, next) => {
  try {
    const { jobId, connectorName } = req.body;
    const userId = req.user?.userId || req.body.userId;

    const session = await AutomationWorkerQueue.enqueueJob(jobId, userId, connectorName);
    
    res.status(202).json({
      success: true,
      message: 'Application job enqueued successfully',
      sessionId: session._id,
      status: session.status
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/automation/status/:id
router.get('/status/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const session = await ApplicationSession.findById(req.params.id);
    if (!session) {
      throw new NotFoundError(`Session not found with ID: ${req.params.id}`);
    }
    res.json({
      success: true,
      status: session.status,
      error: session.error,
      retryCount: session.retryCount,
      lastUpdatedAt: session.lastUpdatedAt
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/automation/logs/:id
router.get('/logs/:id', authenticate, validateObjectId('id'), async (req, res, next) => {
  try {
    const logs = await AutomationLog.find({ applicationSessionId: req.params.id }).sort({ timestamp: 1 });
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
});

// GET /api/automation/context/:sessionId
router.get('/context/:sessionId', authenticate, async (req, res, next) => {
  try {
    const ApplicationContext = require('../models/ApplicationContext');
    const appContext = await ApplicationContext.findOne({ sessionId: req.params.sessionId });
    if (!appContext) {
      throw new NotFoundError(`Application context not found for session: ${req.params.sessionId}`);
    }
    res.json({ success: true, context: appContext });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
