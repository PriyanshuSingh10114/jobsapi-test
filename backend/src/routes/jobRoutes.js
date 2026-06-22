const express = require('express');
const { getJobs, syncJobs, searchJobs, getSuggestions } = require('../controllers/jobController');

const router = express.Router();

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get jobs with pagination and filters
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *       - in: query
 *         name: remote
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', getJobs);

/**
 * @swagger
 * /api/jobs/search:
 *   get:
 *     summary: Search jobs
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *       - in: query
 *         name: remote
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/suggestions', getSuggestions);
router.get('/search', searchJobs);

/**
 * @swagger
 * /api/jobs/sync:
 *   post:
 *     summary: Trigger manual sync of all job sources
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/sync', syncJobs);

module.exports = router;
