const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UserProfile = require('../models/UserProfile');
const CandidateProfileResolver = require('../automation/engine/CandidateProfileResolver');

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

function calculateCompleteness(profile) {
  let filled = 0;
  let total = 0;
  let missingFields = [];

  const check = (path, name) => {
    total++;
    const value = path.split('.').reduce((o, i) => o?.[i], profile);
    if (value && value.toString().trim() !== '') {
      filled++;
    } else {
      missingFields.push(name);
    }
  };

  check('basicInfo.firstName', 'First Name');
  check('basicInfo.lastName', 'Last Name');
  check('basicInfo.email', 'Email');
  check('location.country', 'Country');
  check('professionalInfo.currentPosition', 'Current Position');
  check('professionalInfo.expectedSalary', 'Expected Salary');
  check('workAuthorization.country', 'Work Auth Country');

  return {
    overall: total > 0 ? Math.round((filled / total) * 100) : 0,
    missingFields
  };
}

// GET /api/user/profile
router.get('/profile', async (req, res, next) => {
  try {
    let profile = await UserProfile.findOne({ userId: DEFAULT_USER_ID });
    if (!profile) {
      profile = await UserProfile.create({ userId: DEFAULT_USER_ID });
    }
    
    const completeness = calculateCompleteness(profile);
    res.json({ success: true, profile, completeness });
  } catch (error) {
    next(error);
  }
});

// GET /api/user/profile/complete (Phase 4)
router.get('/profile/complete', async (req, res, next) => {
  try {
    const normalizedProfile = await CandidateProfileResolver.fetchAndNormalize(DEFAULT_USER_ID);
    const validationReport = CandidateProfileResolver.validate(normalizedProfile);
    
    res.json({
      success: true,
      profile: normalizedProfile,
      validation: validationReport
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/user/profile
router.patch('/profile', async (req, res, next) => {
  try {
    const flatten = (obj, prefix = '') => {
      let result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(result, flatten(value, `${prefix}${key}.`));
        } else {
          result[`${prefix}${key}`] = value;
        }
      }
      return result;
    };

    const updateFields = flatten(req.body);
    
    let profile = await UserProfile.findOneAndUpdate(
      { userId: DEFAULT_USER_ID },
      { $set: updateFields },
      { new: true, upsert: true }
    );
    
    const completeness = calculateCompleteness(profile);
    res.json({ success: true, profile, completeness });
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
    
    const absolutePath = path.resolve(req.file.path);
    
    let profile = await UserProfile.findOne({ userId: DEFAULT_USER_ID });
    if (!profile) {
       profile = new UserProfile({ userId: DEFAULT_USER_ID });
    }
    
    // Push new asset
    profile.assets.push({
       name: req.file.originalname,
       version: '1.0',
       filePath: absolutePath,
       isCoverLetter: false,
       isPortfolio: false,
       isCertificate: false
    });
    
    await profile.save();
    
    res.json({ success: true, profile });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
