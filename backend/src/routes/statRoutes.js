const express = require('express');
const { getStats } = require('../controllers/statController');

const router = express.Router();

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Get overall dashboard stats
 *     tags: [Stats]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', getStats);

module.exports = router;
