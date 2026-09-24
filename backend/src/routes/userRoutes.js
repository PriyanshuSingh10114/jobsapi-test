const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UserProfile = require('../models/UserProfile');
const UCKGraph = require('../models/UCKGraph');
const ProfileHistory = require('../models/ProfileHistory');
const CandidateProfileResolver = require('../automation/engine/CandidateProfileResolver');
const ATSReadinessEngine = require('../automation/engine/ATSReadinessEngine');
const UNIVERSAL_FIELD_REGISTRY = require('../config/universalFieldRegistry');

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

// GET /api/user/registry
router.get('/registry', (req, res) => {
  res.json({ success: true, count: UNIVERSAL_FIELD_REGISTRY.length, registry: UNIVERSAL_FIELD_REGISTRY });
});

// GET /api/user/readiness
router.get('/readiness', async (req, res, next) => {
  try {
    let profile = await UCKGraph.findOne({ userId: DEFAULT_USER_ID });
    if (!profile) profile = await UserProfile.findOne({ userId: DEFAULT_USER_ID });
    const readiness = ATSReadinessEngine.calculateReadiness(profile);
    res.json({ success: true, readiness });
  } catch (error) {
    next(error);
  }
});

// Helper function to deep-merge objects
function deepMerge(target = {}, source = {}) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  }
  return output;
}

// GET /api/user/profile
router.get('/profile', async (req, res, next) => {
  try {
    let userProfileDoc = await UserProfile.findOne({ userId: DEFAULT_USER_ID });
    if (!userProfileDoc) {
      userProfileDoc = await UserProfile.create({ userId: DEFAULT_USER_ID });
    }
    let uckDoc = await UCKGraph.findOne({ userId: DEFAULT_USER_ID });

    // Deep merge UserProfile & UCKGraph into unified response
    const plainUserProfile = userProfileDoc.toObject ? userProfileDoc.toObject() : userProfileDoc;
    const plainUCK = uckDoc ? (uckDoc.toObject ? uckDoc.toObject() : uckDoc) : {};
    const mergedProfile = deepMerge(plainUserProfile, plainUCK);

    // Ensure identity and basicInfo mirror each other
    if (mergedProfile.identity) {
      mergedProfile.basicInfo = { ...mergedProfile.basicInfo, ...mergedProfile.identity };
    }
    if (mergedProfile.contact) {
      mergedProfile.basicInfo = { ...mergedProfile.basicInfo, ...mergedProfile.contact };
    }

    const completeness = calculateCompleteness(mergedProfile);
    const readiness = ATSReadinessEngine.calculateReadiness(mergedProfile);
    res.json({ success: true, profile: mergedProfile, completeness, readiness });
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

// GET /api/user/history
router.get('/history', async (req, res, next) => {
  try {
    const history = await ProfileHistory.find({ userId: DEFAULT_USER_ID }).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, count: history.length, history });
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
    
    // Auto-map canonical fields to legacy fields for complete backward compatibility
    const extraFields = {};
    if (updateFields['identity.firstName']) extraFields['basicInfo.firstName'] = updateFields['identity.firstName'];
    if (updateFields['identity.middleName']) extraFields['basicInfo.middleName'] = updateFields['identity.middleName'];
    if (updateFields['identity.lastName']) extraFields['basicInfo.lastName'] = updateFields['identity.lastName'];
    if (updateFields['identity.preferredName']) extraFields['basicInfo.preferredName'] = updateFields['identity.preferredName'];
    if (updateFields['identity.pronouns']) extraFields['basicInfo.pronouns'] = updateFields['identity.pronouns'];
    if (updateFields['contact.email']) extraFields['basicInfo.email'] = updateFields['contact.email'];
    if (updateFields['contact.phone']) extraFields['basicInfo.phone'] = updateFields['contact.phone'];
    if (updateFields['authorization.isAuthorizedInUS'] !== undefined) extraFields['workAuthorization.citizen'] = updateFields['authorization.isAuthorizedInUS'];
    if (updateFields['authorization.requiresSponsorshipNowOrFuture'] !== undefined) extraFields['workAuthorization.needSponsorship'] = updateFields['authorization.requiresSponsorshipNowOrFuture'];

    const fullUpdatePayload = { ...updateFields, ...extraFields };

    // Log history audit records
    Object.entries(updateFields).forEach(async ([fieldCanonicalId, newValue]) => {
      try {
        await ProfileHistory.create({
          userId: DEFAULT_USER_ID,
          fieldCanonicalId,
          newValue,
          source: 'User',
          changedBy: 'User'
        });
      } catch (e) {}
    });

    // ATOMIC DUAL-DOCUMENT UPDATE
    const updatedUserProfile = await UserProfile.findOneAndUpdate(
      { userId: DEFAULT_USER_ID },
      { $set: fullUpdatePayload },
      { new: true, upsert: true }
    );

    const updatedUCK = await UCKGraph.findOneAndUpdate(
      { userId: DEFAULT_USER_ID },
      { $set: fullUpdatePayload },
      { new: true, upsert: true }
    );

    // Deep merge response
    const plainUserProfile = updatedUserProfile.toObject ? updatedUserProfile.toObject() : updatedUserProfile;
    const plainUCK = updatedUCK ? (updatedUCK.toObject ? updatedUCK.toObject() : updatedUCK) : {};
    const mergedProfile = deepMerge(plainUserProfile, plainUCK);

    if (mergedProfile.identity) {
      mergedProfile.basicInfo = { ...mergedProfile.basicInfo, ...mergedProfile.identity };
    }
    if (mergedProfile.contact) {
      mergedProfile.basicInfo = { ...mergedProfile.basicInfo, ...mergedProfile.contact };
    }

    const completeness = calculateCompleteness(mergedProfile);
    const readiness = ATSReadinessEngine.calculateReadiness(mergedProfile);
    res.json({ success: true, profile: mergedProfile, completeness, readiness });
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
