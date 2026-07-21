const fs = require('fs').promises;
const path = require('path');
const UserProfile = require('../../models/UserProfile');
const logger = require('../../config/logger');

class CandidateProfileResolver {
  /**
   * Fetches the raw profile from MongoDB, normalizes it into a strictly typed CandidateProfile,
   * and validates the physical presence of uploaded assets.
   * @param {string} userId - The Clerk userId
   * @returns {Promise<Object>} Normalized CandidateProfile
   */
  static async fetchAndNormalize(userId) {
    logger.info(`CandidateProfileResolver: Fetching profile for ${userId}`);
    
    const profile = await UserProfile.findOne({ userId });
    if (!profile) {
      throw new Error('Profile not found. Please complete Profile Studio.');
    }

    const raw = profile.toObject();

    // PHASE 2: NORMALIZATION
    const normalized = {
      personal: {
        firstName: raw.basicInfo?.firstName || '',
        middleName: raw.basicInfo?.middleName || '',
        lastName: raw.basicInfo?.lastName || '',
        preferredName: raw.basicInfo?.preferredName || '',
        dob: raw.basicInfo?.dob || '',
        pronouns: raw.basicInfo?.pronouns || ''
      },
      contact: {
        email: raw.basicInfo?.email || '',
        secondaryEmail: raw.basicInfo?.secondaryEmail || '',
        phone: raw.basicInfo?.phone || '',
        countryCode: raw.basicInfo?.countryCode || ''
      },
      location: {
        country: raw.location?.country || '',
        state: raw.location?.state || '',
        city: raw.location?.city || '',
        address: raw.location?.address || '',
        zipCode: raw.location?.zipCode || '',
        willingToRelocate: raw.location?.willingToRelocate || false
      },
      // Map institution to school, cgpa to gpa
      education: (raw.education || []).map(edu => ({
        school: edu.institution || '',
        degree: edu.degree || '',
        discipline: edu.major || '',
        gpa: edu.cgpa || '',
        graduationDate: edu.graduationDate || ''
      })).sort((a, b) => new Date(b.graduationDate || 0) - new Date(a.graduationDate || 0)),
      experience: (raw.experience || []).map(exp => ({
        company: exp.company || '',
        title: exp.role || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        responsibilities: exp.responsibilities || '',
        technologies: exp.technologies || []
      })).sort((a, b) => new Date(b.endDate || Date.now()) - new Date(a.endDate || Date.now())),
      projects: raw.projects || [],
      skills: raw.skills || {},
      certifications: raw.certifications || [],
      workAuthorization: {
        authorized: raw.workAuthorization?.visa || raw.workAuthorization?.citizen || false,
        requiresSponsorship: raw.workAuthorization?.needSponsorship || false,
        country: raw.workAuthorization?.country || ''
      },
      preferences: raw.preferences || {},
      demographics: raw.demographic || {},
      links: raw.links || {},
      answers: raw.answerBank || {},
      documents: {
        defaultResume: null,
        resumes: [],
        coverLetters: []
      }
    };

    // PHASE 3 & 8: DOCUMENT RESOLUTION & VERIFICATION
    logger.info('CandidateProfileResolver: Resolving and verifying documents...');
    const assets = raw.assets || [];
    for (const asset of assets) {
      if (!asset.filePath) continue;

      // Verify physical file exists
      try {
        await fs.access(asset.filePath);
        const docRecord = {
          id: asset._id ? asset._id.toString() : 'unknown',
          filename: asset.name || path.basename(asset.filePath),
          storagePath: asset.filePath,
          atsScore: asset.atsScore || 0
        };

        if (asset.isCoverLetter) {
          normalized.documents.coverLetters.push(docRecord);
        } else if (!asset.isPortfolio && !asset.isCertificate) {
          normalized.documents.resumes.push(docRecord);
        }
      } catch (err) {
        logger.error(`Document Verification Failed: File not found on disk at ${asset.filePath}. Removing from automation cache.`);
        // File does not exist physically, so we do not add it to normalized.documents
      }
    }

    // Sort resumes by ATS score descending and pick default
    if (normalized.documents.resumes.length > 0) {
      normalized.documents.resumes.sort((a, b) => b.atsScore - a.atsScore);
      normalized.documents.defaultResume = normalized.documents.resumes[0].storagePath;
    }

    logger.info('CandidateProfileResolver: Normalization complete.');
    return normalized;
  }

  /**
   * Validates that the normalized profile meets minimum requirements for automation.
   * @param {Object} profile - Normalized profile
   * @returns {Object} ValidationReport { canContinue, criticalErrors, warnings, completion }
   */
  static validate(profile) {
    const criticalErrors = [];
    const warnings = [];

    // Critical Errors (Must stop automation)
    if (!profile.contact.email) criticalErrors.push('Email');
    if (!profile.personal.firstName || !profile.personal.lastName) criticalErrors.push('Full Name');
    if (!profile.documents.defaultResume) criticalErrors.push('Resume');

    // Warnings (Can continue automation)
    if (!profile.contact.phone) warnings.push('Phone');
    if (!profile.links.linkedin) warnings.push('LinkedIn URL');
    if (!profile.links.portfolio) warnings.push('Portfolio URL');
    if (profile.education.length === 0) warnings.push('Education');
    if (profile.experience.length === 0) warnings.push('Experience');
    if (profile.projects.length === 0) warnings.push('Projects');
    if (profile.certifications.length === 0) warnings.push('Certifications');

    const totalExpectedFields = 10;
    const filledFields = totalExpectedFields - criticalErrors.length - warnings.length;
    const completion = Math.round((filledFields / totalExpectedFields) * 100);

    return {
      canContinue: criticalErrors.length === 0,
      criticalErrors,
      warnings,
      completion
    };
  }
}

module.exports = CandidateProfileResolver;
