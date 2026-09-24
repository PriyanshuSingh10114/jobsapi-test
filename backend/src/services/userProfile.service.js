const UserProfile = require('../models/UserProfile');
const UCKGraph = require('../models/UCKGraph');
const ProfileHistory = require('../models/ProfileHistory');
const CandidateProfileResolver = require('../automation/engine/CandidateProfileResolver');
const ATSReadinessEngine = require('../automation/engine/ATSReadinessEngine');
const UNIVERSAL_FIELD_REGISTRY = require('../config/universalFieldRegistry');
const storageService = require('./storage.service');
const { ValidationError, NotFoundError } = require('../errors/AppErrors');
const logger = require('../config/logger');

// Deep merge helper
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

function calculateCompleteness(profile) {
  let filled = 0;
  let total = 0;
  const missingFields = [];

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

class UserProfileService {
  async getProfile(userId) {
    let userProfileDoc = await UserProfile.findOne({ userId });
    if (!userProfileDoc) {
      userProfileDoc = await UserProfile.create({ userId });
    }
    const uckDoc = await UCKGraph.findOne({ userId });

    const plainUserProfile = userProfileDoc.toObject ? userProfileDoc.toObject() : userProfileDoc;
    const plainUCK = uckDoc ? (uckDoc.toObject ? uckDoc.toObject() : uckDoc) : {};
    const mergedProfile = deepMerge(plainUserProfile, plainUCK);

    if (mergedProfile.identity) {
      mergedProfile.basicInfo = { ...mergedProfile.basicInfo, ...mergedProfile.identity };
    }
    if (mergedProfile.contact) {
      mergedProfile.basicInfo = { ...mergedProfile.basicInfo, ...mergedProfile.contact };
    }

    const completeness = calculateCompleteness(mergedProfile);
    const readiness = ATSReadinessEngine.calculateReadiness(mergedProfile);

    return {
      profile: mergedProfile,
      completeness,
      readiness
    };
  }

  async getReadiness(userId) {
    let profile = await UCKGraph.findOne({ userId });
    if (!profile) profile = await UserProfile.findOne({ userId });
    if (!profile) {
      throw new NotFoundError(`Profile not found for userId: ${userId}`);
    }
    return ATSReadinessEngine.calculateReadiness(profile);
  }

  async getCompleteProfile(userId) {
    const normalizedProfile = await CandidateProfileResolver.fetchAndNormalize(userId);
    const validationReport = CandidateProfileResolver.validate(normalizedProfile);
    return {
      profile: normalizedProfile,
      validation: validationReport
    };
  }

  async getHistory(userId, limit = 50) {
    return await ProfileHistory.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }

  async updateProfile(userId, body) {
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

    const updateFields = flatten(body);
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

    // Record audit history entries asynchronously
    Object.entries(updateFields).forEach(async ([fieldCanonicalId, newValue]) => {
      try {
        await ProfileHistory.create({
          userId,
          fieldCanonicalId,
          newValue,
          source: 'User',
          changedBy: 'User'
        });
      } catch (e) {}
    });

    const updatedUserProfile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: fullUpdatePayload },
      { new: true, upsert: true }
    );

    const updatedUCK = await UCKGraph.findOneAndUpdate(
      { userId },
      { $set: fullUpdatePayload },
      { new: true, upsert: true }
    );

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

    return {
      profile: mergedProfile,
      completeness,
      readiness
    };
  }

  async uploadResumeAsset(userId, file) {
    if (!file) {
      throw new ValidationError('No resume file provided');
    }

    let profile = await UserProfile.findOne({ userId });
    if (!profile) {
      profile = new UserProfile({ userId });
    }

    const secureUrl = storageService.getPublicUrl(file.filename, 'resumes');

    profile.assets.push({
      name: file.originalname,
      version: '1.0',
      filePath: file.path, // stored securely
      isCoverLetter: false,
      isPortfolio: false,
      isCertificate: false
    });

    await profile.save();

    // Also update UCKGraph defaultResumePath
    await UCKGraph.findOneAndUpdate(
      { userId },
      { $set: { 'documents.defaultResumePath': file.path } },
      { upsert: true }
    );

    return {
      asset: {
        name: file.originalname,
        url: secureUrl,
        sizeBytes: file.size
      },
      profile
    };
  }
}

module.exports = new UserProfileService();
