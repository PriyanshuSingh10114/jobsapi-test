const express = require('express');
const router = express.Router();
const debugController = require('../controllers/debugController');

router.get('/performance', debugController.getPerformance);
router.get('/count', debugController.getCount);
router.get('/sources', debugController.getSources);
router.get('/job-types', debugController.getJobTypes);
router.get('/job-regions', debugController.getJobRegions);
router.get('/companies', debugController.getCompanies);
router.get('/locations', debugController.getLocations);

module.exports = router;
