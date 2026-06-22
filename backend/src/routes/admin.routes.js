const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/health', adminController.getHealth);

module.exports = router;
