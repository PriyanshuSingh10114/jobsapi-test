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
        firstName: raw.basicInfo?.firstName || raw.firstName || '',
        middleName: raw.basicInfo?.middleName || '',
        lastName: raw.basicInfo?.lastName || raw.lastName || '',
        preferredName: raw.basicInfo?.preferredName || raw.firstName || '',
        dob: raw.basicInfo?.dob || '',
        pronouns: raw.basicInfo?.pronouns || ''
      },
      contact: {
        email: raw.basicInfo?.email || raw.email || '',
        secondaryEmail: raw.basicInfo?.secondaryEmail || '',
        phone: raw.basicInfo?.phone || raw.phone || '',
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
      links: {
          linkedin: raw.links?.linkedin || raw.linkedin || '',
          github: raw.links?.github || raw.github || '',
          portfolio: raw.links?.portfolio || raw.portfolio || '',
          personalWebsite: raw.links?.personalWebsite || '',
          kaggle: raw.links?.kaggle || '',
          medium: raw.links?.medium || '',
          devto: raw.links?.devto || '',
          stackoverflow: raw.links?.stackoverflow || '',
          behance: raw.links?.behance || '',
          dribbble: raw.links?.dribbble || '',
          googleScholar: raw.links?.googleScholar || '',
          orcid: raw.links?.orcid || ''
      },
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
    
    // Fallback to legacy root resumePath if no assets were found
    if (normalized.documents.resumes.length === 0 && raw.resumePath) {
        try {
            await fs.access(raw.resumePath, fs.constants.R_OK);
            normalized.documents.resumes.push({
                id: 'legacy-root',
                filename: path.basename(raw.resumePath),
                storagePath: raw.resumePath,
                atsScore: 0
            });
            logger.info('CandidateProfileResolver: Successfully mapped legacy root resumePath.');
        } catch(e) {
            logger.warn(`Legacy resumePath ${raw.resumePath} was unreadable.`);
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
    const completenessReport = [];
    let filledFields = 0;
    const totalExpectedFields = 10;

    const checkField = (name, isValid, isCritical) => {
        completenessReport.push({ field: name, complete: isValid });
        if (isValid) {
            filledFields++;
        } else {
            if (isCritical) criticalErrors.push(name);
            else warnings.push(name);
        }
    };

    // Critical Errors (Must stop automation)
    checkField('Email', !!profile.contact.email, true);
    checkField('Full Name', !!(profile.personal.firstName && profile.personal.lastName), true);
    checkField('Resume', !!profile.documents.defaultResume, true);

    // Warnings (Can continue automation)
    checkField('Phone', !!profile.contact.phone, false);
    checkField('LinkedIn URL', !!profile.links.linkedin, false);
    checkField('Portfolio URL', !!profile.links.portfolio, false);
    checkField('Country', !!profile.location.country, false);
    checkField('City', !!profile.location.city, false);
    checkField('Education', profile.education.length > 0, false);
    checkField('Experience', profile.experience.length > 0, false);
    
    // Additional Optional
    if (profile.documents.coverLetters.length > 0) {
        completenessReport.push({ field: 'Cover Letter', complete: true });
    } else {
        completenessReport.push({ field: 'Cover Letter', complete: false });
    }

    const completion = Math.round((filledFields / totalExpectedFields) * 100);

    return {
      canContinue: criticalErrors.length === 0,
      criticalErrors,
      warnings,
      completion,
      completenessReport
    };
  }
}

module.exports = CandidateProfileResolver;
