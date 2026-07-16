const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UserProfile = require('../models/UserProfile');

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for Resume PDFs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Since we have no auth, use a hardcoded default user
const DEFAULT_USER_ID = 'local_admin_1';

// GET /api/user/profile
router.get('/profile', async (req, res, next) => {
  try {
    let profile = await UserProfile.findOne({ userId: DEFAULT_USER_ID });
    if (!profile) {
      // Create empty profile
      profile = await UserProfile.create({ userId: DEFAULT_USER_ID });
    }
    res.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
});

// POST /api/user/profile
router.post('/profile', async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, linkedin, portfolio } = req.body;
    const profile = await UserProfile.findOneAndUpdate(
      { userId: DEFAULT_USER_ID },
      { $set: { firstName, lastName, email, phone, linkedin, portfolio } },
      { new: true, upsert: true }
    );
    res.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
});

// POST /api/user/resume
router.post('/resume', upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Save absolute path for Playwright
    const absolutePath = path.resolve(req.file.path);
    
    const profile = await UserProfile.findOneAndUpdate(
      { userId: DEFAULT_USER_ID },
      { $set: { resumePath: absolutePath } },
      { new: true, upsert: true }
    );
    
    res.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
