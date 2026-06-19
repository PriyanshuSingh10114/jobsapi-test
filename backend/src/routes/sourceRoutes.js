const express = require('express');
const { getSources, getSourceByName } = require('../controllers/sourceController');

const router = express.Router();

/**
 * @swagger
 * /api/sources:
 *   get:
 *     summary: Get all sources
 *     tags: [Sources]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', getSources);

/**
 * @swagger
 * /api/sources/{name}:
 *   get:
 *     summary: Get source by name
 *     tags: [Sources]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       404:
 *         description: Not found
 */
router.get('/:name', getSourceByName);

module.exports = router;
