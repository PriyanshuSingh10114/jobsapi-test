const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const candidateController = require('../controllers/candidate.controller');
const { authenticate } = require('../middleware/auth');
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
      const secureName = storageService.generateSecureFilename(file.originalname, 'doc');
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

// Profile endpoints
router.get('/profile', authenticate, candidateController.getProfile);
router.put('/profile', authenticate, candidateController.updateProfile);
router.patch('/profile', authenticate, candidateController.updateProfile);
router.get('/readiness', authenticate, candidateController.getReadiness);

// Experience endpoints
router.get('/experience', authenticate, candidateController.getExperience);
router.post('/experience', authenticate, candidateController.addExperience);
router.put('/experience/:id', authenticate, candidateController.updateExperience);
router.delete('/experience/:id', authenticate, candidateController.deleteExperience);

// Education endpoints
router.get('/education', authenticate, candidateController.getEducation);
router.post('/education', authenticate, candidateController.addEducation);
router.put('/education/:id', authenticate, candidateController.updateEducation);
router.delete('/education/:id', authenticate, candidateController.deleteEducation);

// Document endpoints
router.get('/documents', authenticate, candidateController.getDocuments);
router.post('/documents', authenticate, uploadRateLimiter, upload.single('document'), candidateController.uploadDocument);
router.post('/resume', authenticate, uploadRateLimiter, upload.single('resume'), candidateController.uploadDocument);

// Application Answers Bank
router.get('/application-answers', authenticate, candidateController.getProfile);
router.put('/application-answers', authenticate, candidateController.updateApplicationAnswers);

// Preflight validation
router.post('/preflight', authenticate, candidateController.runPreflight);

module.exports = router;
