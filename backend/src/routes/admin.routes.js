const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

router.get('/health', adminController.getHealth);
router.get('/connectors', adminController.getConnectors);
router.get('/sync-history', adminController.getSyncHistory);
router.get('/metrics', adminController.getMetrics);
router.get('/failures', adminController.getFailures);
router.get('/skipped', adminController.getSkipped);

module.exports = router;
