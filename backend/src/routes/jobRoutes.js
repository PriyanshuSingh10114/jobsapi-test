const express = require('express');
const { getJobs, syncJobs, searchJobs, getSuggestions } = require('../controllers/jobController');
const { syncRateLimiter } = require('../middleware/rateLimiter');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get jobs with pagination and filters
 *     tags: [Jobs]
 */
router.get('/', getJobs);

/**
 * @swagger
 * /api/jobs/suggestions:
 *   get:
 *     summary: Autocomplete search suggestions
 *     tags: [Jobs]
 */
router.get('/suggestions', getSuggestions);

/**
 * @swagger
 * /api/jobs/search:
 *   get:
 *     summary: Search jobs with relevance scoring and filters
 *     tags: [Jobs]
 */
router.get('/search', searchJobs);

/**
 * @swagger
 * /api/jobs/sync:
 *   post:
 *     summary: Trigger manual synchronization across all ATS sources
 *     tags: [Jobs]
 */
router.post('/sync', authenticate, authorize('ADMIN', 'SYSTEM'), syncRateLimiter, syncJobs);

module.exports = router;
