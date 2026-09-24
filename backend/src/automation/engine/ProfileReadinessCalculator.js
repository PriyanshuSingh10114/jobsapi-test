/**
 * Profile Readiness Calculator
 * Evaluates honest completeness across all canonical candidate categories.
 * Never calculates fake scores; strictly evaluates real data points.
 */

class ProfileReadinessCalculator {
  /**
   * Evaluates candidate profile readiness
   * @param {Object} candidate - Canonical CandidateProfile instance
   * @returns {Object} Comprehensive readiness scorecard
   */
  static calculateReadiness(candidate) {
    const res = this.calculate(candidate);
    return {
      ...res,
      isReady: res.isAutoApplyReady
    };
  }

  static calculate(candidate) {
    if (!candidate) {
      return {
        overallScore: 0,
        isAutoApplyReady: false,
        categories: {},
        missingRequiredFields: ['candidate.profile']
      };
    }

    const categories = {
      identity: {
        label: 'Identity',
        requiredFields: ['firstName', 'lastName'],
        filled: 0,
        total: 2,
        status: 'Incomplete'
      },
      contact: {
        label: 'Contact & Communication',
        requiredFields: ['email', 'phone'],
        filled: 0,
        total: 2,
        status: 'Incomplete'
      },
      location: {
        label: 'Location Coordinates',
        requiredFields: ['city', 'state', 'postalCode', 'country'],
        filled: 0,
        total: 4,
        status: 'Incomplete'
      },
      workAuthorization: {
        label: 'Work Authorization & Legal',
        requiredFields: ['authorizedToWorkInUS', 'requiresSponsorshipNow'],
        filled: 0,
        total: 2,
        status: 'Unknown'
      },
      experience: {
        label: 'Work Experience',
        requiredFields: ['experience'],
        filled: 0,
        total: 1,
        status: 'Incomplete'
      },
      education: {
        label: 'Education History',
        requiredFields: ['education'],
        filled: 0,
        total: 1,
        status: 'Incomplete'
      },
      skills: {
        label: 'Technical Skills Stack',
        requiredFields: ['skills'],
        filled: 0,
        total: 1,
        status: 'Incomplete'
      },
      documents: {
        label: 'Primary Resume Asset',
        requiredFields: ['primaryResume'],
        filled: 0,
        total: 1,
        status: 'Incomplete'
      }
    };

    const missingRequiredFields = [];

    // 1. Identity
    if (candidate.identity?.firstName?.trim()) categories.identity.filled++;
    else missingRequiredFields.push('identity.firstName');
    if (candidate.identity?.lastName?.trim()) categories.identity.filled++;
    else missingRequiredFields.push('identity.lastName');
    categories.identity.status = categories.identity.filled === categories.identity.total ? 'Complete' : 'Incomplete';

    // 2. Contact
    if (candidate.identity?.email?.trim()) categories.contact.filled++;
    else missingRequiredFields.push('identity.email');
    if (candidate.identity?.phone?.trim()) categories.contact.filled++;
    else missingRequiredFields.push('identity.phone');
    categories.contact.status = categories.contact.filled === categories.contact.total ? 'Complete' : 'Incomplete';

    // 3. Location
    if (candidate.location?.city?.trim()) categories.location.filled++;
    else missingRequiredFields.push('location.city');
    if (candidate.location?.state?.trim()) categories.location.filled++;
    else missingRequiredFields.push('location.state');
    if (candidate.location?.postalCode?.trim()) categories.location.filled++;
    else missingRequiredFields.push('location.postalCode');
    if (candidate.location?.country?.trim()) categories.location.filled++;
    else missingRequiredFields.push('location.country');
    categories.location.status = categories.location.filled === categories.location.total ? 'Complete' : 'Incomplete';

    // 4. Work Authorization
    const auth = candidate.workAuthorization?.authorizedToWorkInUS;
    const sponsor = candidate.workAuthorization?.requiresSponsorshipNow;
    if (auth !== 'unknown' && auth !== null && auth !== undefined) categories.workAuthorization.filled++;
    else missingRequiredFields.push('workAuthorization.authorizedToWorkInUS');
    if (sponsor !== 'unknown' && sponsor !== null && sponsor !== undefined) categories.workAuthorization.filled++;
    else missingRequiredFields.push('workAuthorization.requiresSponsorshipNow');

    if (categories.workAuthorization.filled === 2) {
      categories.workAuthorization.status = 'Complete';
    } else if (categories.workAuthorization.filled === 1) {
      categories.workAuthorization.status = 'Needs verification';
    } else {
      categories.workAuthorization.status = 'Unknown';
    }

    // 5. Experience
    const expCount = Array.isArray(candidate.experience) ? candidate.experience.length : 0;
    if (expCount > 0) {
      categories.experience.filled = 1;
      categories.experience.status = 'Complete';
    } else {
      categories.experience.status = 'Incomplete';
    }

    // 6. Education
    const eduCount = Array.isArray(candidate.education) ? candidate.education.length : 0;
    if (eduCount > 0) {
      categories.education.filled = 1;
      categories.education.status = 'Complete';
    } else {
      categories.education.status = 'Incomplete';
    }

    // 7. Skills
    const skillsCount = Array.isArray(candidate.professionalProfile?.skills) ? candidate.professionalProfile.skills.length : 0;
    if (skillsCount > 0) {
      categories.skills.filled = 1;
      categories.skills.status = 'Complete';
    } else {
      categories.skills.status = 'Incomplete';
    }

    // 8. Documents
    const hasResume = Boolean(
      (candidate.documents?.resumes && candidate.documents.resumes.length > 0) ||
      (candidate.assets && candidate.assets.length > 0)
    );
    if (hasResume) {
      categories.documents.filled = 1;
      categories.documents.status = 'Complete';
    } else {
      categories.documents.status = 'Incomplete';
      missingRequiredFields.push('documents.resumes');
    }

    // Compute Overall Score
    let totalFilled = 0;
    let totalFields = 0;
    for (const cat of Object.values(categories)) {
      totalFilled += cat.filled;
      totalFields += cat.total;
    }

    const overallScore = totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0;
    const isAutoApplyReady = missingRequiredFields.length === 0 && categories.workAuthorization.status === 'Complete';

    return {
      overallScore,
      isAutoApplyReady,
      categories,
      missingRequiredFields,
      summary: {
        totalCategories: Object.keys(categories).length,
        completeCategories: Object.values(categories).filter(c => c.status === 'Complete').length
      }
    };
  }
}

module.exports = ProfileReadinessCalculator;
