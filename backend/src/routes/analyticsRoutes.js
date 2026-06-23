const express = require('express');
const { getSources } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/sources', getSources);

module.exports = router;
