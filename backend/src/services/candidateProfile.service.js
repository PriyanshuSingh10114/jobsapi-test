const CandidateProfile = require('../models/CandidateProfile');
const UserProfile = require('../models/UserProfile');
const UCKGraph = require('../models/UCKGraph');
const ProfileReadinessCalculator = require('../automation/engine/ProfileReadinessCalculator');
const ApplicationPreflightValidator = require('../automation/engine/ApplicationPreflightValidator');
const storageService = require('./storage.service');
const { ValidationError, NotFoundError } = require('../errors/AppErrors');
const logger = require('../config/logger');

class CandidateProfileService {
  /**
   * Retrieves or initializes a canonical CandidateProfile.
   * If a legacy UserProfile or UCKGraph exists, automatically migrates and merges into the canonical model.
   * @param {string} candidateId
   */
  async getProfile(candidateId) {
    let profile = await CandidateProfile.findOne({
      $or: [{ candidateId }, { userId: candidateId }]
    });

    if (!profile) {
      // Migrate from legacy documents if available
      const legacyUser = await UserProfile.findOne({ userId: candidateId }).lean();
      const legacyUck = await UCKGraph.findOne({ userId: candidateId }).lean();

      profile = new CandidateProfile({
        candidateId,
        userId: candidateId,
        identity: {
          firstName: legacyUck?.identity?.firstName || legacyUser?.basicInfo?.firstName || 'Candidate',
          middleName: legacyUck?.identity?.middleName || legacyUser?.basicInfo?.middleName || '',
          lastName: legacyUck?.identity?.lastName || legacyUser?.basicInfo?.lastName || 'User',
          preferredName: legacyUck?.identity?.preferredName || legacyUser?.basicInfo?.preferredName || '',
          email: legacyUck?.contact?.email || legacyUser?.basicInfo?.email || 'candidate@example.com',
          phone: legacyUck?.contact?.phone || legacyUser?.basicInfo?.phone || '+1-555-0199'
        },
        location: {
          city: legacyUck?.location?.city || legacyUser?.location?.city || 'San Francisco',
          state: legacyUck?.location?.state || legacyUser?.location?.state || 'CA',
          postalCode: legacyUck?.location?.zipCode || legacyUser?.location?.zipCode || '94105',
          country: legacyUck?.location?.country || legacyUser?.location?.country || 'United States'
        },
        contact: {
          linkedinUrl: legacyUck?.links?.linkedin || legacyUser?.links?.linkedin || '',
          githubUrl: legacyUck?.links?.github || legacyUser?.links?.github || '',
          portfolioUrl: legacyUck?.links?.portfolio || legacyUser?.links?.portfolio || ''
        },
        professionalProfile: {
          currentTitle: legacyUser?.professionalInfo?.currentPosition || 'Senior Software Engineer',
          yearsOfExperience: legacyUser?.professionalInfo?.yearsExperience || 5,
          skills: ['AWS', 'Docker', 'Kubernetes', 'TypeScript', 'Node.js', 'Python', 'React']
        },
        workAuthorization: {
          authorizedToWorkInUS: legacyUck?.authorization?.isAuthorizedInUS ?? legacyUser?.workAuthorization?.citizen ?? true,
          requiresSponsorshipNow: legacyUck?.authorization?.requiresSponsorshipNowOrFuture ?? legacyUser?.workAuthorization?.needSponsorship ?? false,
          requiresFutureSponsorship: false,
          visaType: legacyUck?.authorization?.visaType || 'Citizen'
        }
      });

      await profile.save();
    }

    const readiness = ProfileReadinessCalculator.calculate(profile);

    return {
      profile,
      readiness
    };
  }

  /**
   * Updates canonical candidate profile fields
   * @param {string} candidateId
   * @param {Object} updateData
   */
  async updateProfile(candidateId, updateData) {
    let profile = await CandidateProfile.findOne({
      $or: [{ candidateId }, { userId: candidateId }]
    });

    if (!profile) {
      profile = new CandidateProfile({ candidateId, userId: candidateId });
    }

    // Merge nested updates safely
    const mergeNested = (target, source) => {
      for (const [key, val] of Object.entries(source)) {
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          if (!target[key]) target[key] = {};
          mergeNested(target[key], val);
        } else if (val !== undefined) {
          target[key] = val;
        }
      }
    };

    mergeNested(profile, updateData);
    await profile.save();

    const readiness = ProfileReadinessCalculator.calculate(profile);
    return {
      profile,
      readiness
    };
  }

  /**
   * Experience CRUD operations
   */
  async addExperience(candidateId, expData) {
    const { profile } = await this.getProfile(candidateId);
    profile.experience.unshift(expData);
    await profile.save();
    return profile.experience;
  }

  async updateExperience(candidateId, expId, updateData) {
    const { profile } = await this.getProfile(candidateId);
    const exp = profile.experience.id(expId) || profile.experience.find(e => e.id === expId);
    if (!exp) throw new NotFoundError(`Experience entry ${expId} not found`);
    Object.assign(exp, updateData);
    await profile.save();
    return exp;
  }

  async deleteExperience(candidateId, expId) {
    const { profile } = await this.getProfile(candidateId);
    profile.experience = profile.experience.filter(e => (e._id ? e._id.toString() !== expId : e.id !== expId));
    await profile.save();
    return profile.experience;
  }

  /**
   * Education CRUD operations
   */
  async addEducation(candidateId, eduData) {
    const { profile } = await this.getProfile(candidateId);
    profile.education.unshift(eduData);
    await profile.save();
    return profile.education;
  }

  async updateEducation(candidateId, eduId, updateData) {
    const { profile } = await this.getProfile(candidateId);
    const edu = profile.education.id(eduId) || profile.education.find(e => e.id === eduId);
    if (!edu) throw new NotFoundError(`Education entry ${eduId} not found`);
    Object.assign(edu, updateData);
    await profile.save();
    return edu;
  }

  async deleteEducation(candidateId, eduId) {
    const { profile } = await this.getProfile(candidateId);
    profile.education = profile.education.filter(e => (e._id ? e._id.toString() !== eduId : e.id !== eduId));
    await profile.save();
    return profile.education;
  }

  /**
   * Resume / Document Upload
   */
  async uploadDocument(candidateId, file, type = 'resume', isDefault = true) {
    if (!file) throw new ValidationError('No document file uploaded');

    const { profile } = await this.getProfile(candidateId);
    const storageKey = file.filename;
    const publicUrl = storageService.getPublicUrl(storageKey, 'resumes');

    const docAsset = {
      name: file.originalname,
      type,
      storageKey,
      mimeType: file.mimetype || 'application/pdf',
      size: file.size,
      isDefault
    };

    if (type === 'resume') {
      if (isDefault) {
        profile.documents.resumes.forEach(r => { r.isDefault = false; });
      }
      profile.documents.resumes.unshift(docAsset);
    } else if (type === 'cover_letter') {
      profile.documents.coverLetters.unshift(docAsset);
    } else {
      profile.documents.other.unshift(docAsset);
    }

    await profile.save();

    return {
      document: {
        ...docAsset,
        url: publicUrl
      },
      profile
    };
  }

  /**
   * Application Answers Bank
   */
  async updateApplicationAnswer(candidateId, answerData) {
    const { profile } = await this.getProfile(candidateId);
    const existingIndex = profile.applicationAnswers.findIndex(a => a.questionKey === answerData.questionKey);

    if (existingIndex >= 0) {
      profile.applicationAnswers[existingIndex] = {
        ...profile.applicationAnswers[existingIndex].toObject(),
        ...answerData,
        lastVerifiedAt: new Date()
      };
    } else {
      profile.applicationAnswers.push({
        ...answerData,
        lastVerifiedAt: new Date()
      });
    }

    await profile.save();
    return profile.applicationAnswers;
  }

  /**
   * Preflight validation for a candidate against a target job
   */
  async runPreflight(candidateId, job, discoveredFields = []) {
    const { profile } = await this.getProfile(candidateId);
    return ApplicationPreflightValidator.validateCandidateForJob(profile, job, discoveredFields);
  }
}

module.exports = new CandidateProfileService();
