const express = require('express');
const router = express.Router();
const { AutomationWorkerQueue } = require('../automation/workers/AutomationWorkerQueue');
const ApplicationSession = require('../models/ApplicationSession');
const AutomationLog = require('../models/AutomationLog');

// POST /automation/start
router.post('/start', async (req, res, next) => {
  try {
    const { jobId, userId, connectorName } = req.body;
    
    if (!jobId || !connectorName || !userId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const UserProfile = require('../models/UserProfile');
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      return res.status(400).json({ success: false, message: 'Profile not found. Please complete Profile Studio.' });
    }
    
    const profileData = profile.toObject();

    const session = await AutomationWorkerQueue.enqueueJob(jobId, userId, connectorName, profileData);
    
    res.status(202).json({
      success: true,
      message: 'Application job enqueued successfully',
      sessionId: session._id
    });
  } catch (error) {
    next(error);
  }
});

// GET /automation/status/:id
router.get('/status/:id', async (req, res, next) => {
  try {
    const session = await ApplicationSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json({ success: true, status: session.status, error: session.error, retryCount: session.retryCount });
  } catch (error) {
    next(error);
  }
});

// GET /automation/logs/:id
router.get('/logs/:id', async (req, res, next) => {
  try {
    const logs = await AutomationLog.find({ applicationSessionId: req.params.id }).sort({ timestamp: 1 });
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
