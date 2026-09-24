const { CanonicalFieldRegistry } = require('../canonical/CanonicalFieldRegistry');
const logger = require('../../config/logger');

/**
 * Application Preflight Validator
 * Verifies candidate profile readiness, resolves sensitive questions,
 * and enforces safety constraints before Playwright touches any ATS.
 */
class ApplicationPreflightValidator {
  /**
   * Validates candidate profile against job and discovered form requirements
   * @param {Object} candidate - Canonical CandidateProfile instance
   * @param {Object} job - Target job requisition document
   * @param {Array<Object>} [discoveredFields=[]] - Discovered DOM form fields
   * @returns {{ ready: boolean, missing: string[], unresolved: string[], warnings: string[], blocked: string[] }}
   */
  static validateCandidateForJob(candidate, job = {}, discoveredFields = []) {
    const missing = [];
    const unresolved = [];
    const warnings = [];
    const blocked = [];

    if (!candidate) {
      return {
        ready: false,
        missing: ['candidate.profile'],
        unresolved: [],
        warnings: [],
        blocked: []
      };
    }

    // 1. Check Mandatory Core Fields
    const coreRequired = [
      'candidate.identity.firstName',
      'candidate.identity.lastName',
      'candidate.identity.email',
      'candidate.identity.phone',
      'candidate.location.city',
      'candidate.location.state',
      'candidate.location.postalCode',
      'candidate.documents.primaryResume'
    ];

    for (const key of coreRequired) {
      const val = CanonicalFieldRegistry.resolveValue(candidate, key);
      if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
        missing.push(key);
      }
    }

    // 2. Sensitive Work Authorization Verification (Never Guess!)
    const authVal = candidate.workAuthorization?.authorizedToWorkInUS;
    const sponsorVal = candidate.workAuthorization?.requiresSponsorshipNow;

    if (authVal === 'unknown' || authVal === null || authVal === undefined) {
      unresolved.push('candidate.workAuthorization.authorizedToWorkInUS');
    }
    if (sponsorVal === 'unknown' || sponsorVal === null || sponsorVal === undefined) {
      unresolved.push('candidate.workAuthorization.requiresSponsorshipNow');
    }

    // 3. Blocked Companies & Roles Check (Candidate Preference Constraints)
    const company = (job.company || '').toLowerCase().trim();
    const title = (job.title || '').toLowerCase().trim();

    const blockedCompanies = (candidate.preferences?.blockedCompanies || []).map(c => c.toLowerCase().trim());
    const blockedRoles = (candidate.preferences?.blockedRoles || []).map(r => r.toLowerCase().trim());

    if (company && blockedCompanies.some(bc => bc && company.includes(bc))) {
      blocked.push(`Company "${job.company}" is in your blocked companies list`);
    }

    if (title && blockedRoles.some(br => br && title.includes(br))) {
      blocked.push(`Role title "${job.title}" contains blocked keyword`);
    }

    // 4. Validate discovered form required fields if provided
    if (Array.isArray(discoveredFields) && discoveredFields.length > 0) {
      for (const field of discoveredFields) {
        if (field.required) {
          const match = CanonicalFieldRegistry.resolveFieldMatch(field.label || field.name);
          if (match) {
            const val = CanonicalFieldRegistry.resolveValue(candidate, match.canonicalKey);
            if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
              if (!missing.includes(match.canonicalKey)) {
                missing.push(match.canonicalKey);
              }
            }
          } else {
            // Unmapped required custom question: check applicationAnswers bank
            const customAnswers = candidate.applicationAnswers || [];
            const hasVerifiedAnswer = customAnswers.some(a =>
              a.userVerified &&
              (a.questionKey.toLowerCase() === (field.name || '').toLowerCase() ||
               a.questionText.toLowerCase() === (field.label || '').toLowerCase())
            );

            if (!hasVerifiedAnswer) {
              unresolved.push(`custom_field:${field.label || field.name || 'required_input'}`);
            }
          }
        }
      }
    }

    const ready = missing.length === 0 && unresolved.length === 0 && blocked.length === 0;

    return {
      ready,
      missing,
      unresolved,
      warnings,
      blocked
    };
  }
}

module.exports = ApplicationPreflightValidator;
