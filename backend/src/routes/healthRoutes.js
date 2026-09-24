const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/health', healthController.getLiveness);
router.get('/health/ready', healthController.getReadiness);
router.get('/health/live', healthController.getLiveness);
router.get('/api/metrics', healthController.getSystemMetrics);

module.exports = router;
