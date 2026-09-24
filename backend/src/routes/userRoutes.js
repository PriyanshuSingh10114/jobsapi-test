const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validator');
const { uploadRateLimiter } = require('../middleware/rateLimiter');
const storageService = require('../services/storage.service');
const config = require('../config');

// Secure Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, storageService.resumeDir);
  },
  filename: function (req, file, cb) {
    try {
      const secureName = storageService.generateSecureFilename(file.originalname, 'resume');
      cb(null, secureName);
    } catch (err) {
      cb(err);
    }
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype === 'application/pdf' && ext === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only valid PDF documents are allowed'));
    }
  },
  limits: { fileSize: config.STORAGE.maxFileSizeMb * 1024 * 1024 }
});

// User Profile & Registry Endpoints
router.get('/registry', userController.getFieldRegistry);
router.get('/readiness', authenticate, userController.getReadiness);
router.get('/profile', authenticate, userController.getProfile);
router.get('/profile/complete', authenticate, userController.getCompleteProfile);
router.get('/history', authenticate, userController.getHistory);

router.patch('/profile', authenticate, validate(schemas.profileUpdate), userController.updateProfile);
router.post('/resume', authenticate, uploadRateLimiter, upload.single('resume'), userController.uploadResume);

module.exports = router;
