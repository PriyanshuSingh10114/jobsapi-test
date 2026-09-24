const logger = require('../../config/logger');

class ATSReadinessEngine {
  constructor() {
    this.sectorRequirements = {
      Greenhouse: [
        { path: 'basicInfo.firstName', weight: 20, name: 'First Name' },
        { path: 'basicInfo.lastName', weight: 20, name: 'Last Name' },
        { path: 'basicInfo.email', weight: 20, name: 'Email' },
        { path: 'basicInfo.phone', weight: 15, name: 'Phone' },
        { path: 'assets.0', weight: 25, name: 'Resume PDF' }
      ],
      Lever: [
        { path: 'basicInfo.firstName', weight: 15, name: 'First Name' },
        { path: 'basicInfo.lastName', weight: 15, name: 'Last Name' },
        { path: 'basicInfo.email', weight: 20, name: 'Email' },
        { path: 'links.linkedin', weight: 25, name: 'LinkedIn URL' },
        { path: 'assets.0', weight: 25, name: 'Resume PDF' }
      ],
      Ashby: [
        { path: 'basicInfo.firstName', weight: 15, name: 'First Name' },
        { path: 'basicInfo.lastName', weight: 15, name: 'Last Name' },
        { path: 'basicInfo.email', weight: 20, name: 'Email' },
        { path: 'links.github', weight: 25, name: 'GitHub URL' },
        { path: 'assets.0', weight: 25, name: 'Resume PDF' }
      ],
      Workday: [
        { path: 'basicInfo.firstName', weight: 10, name: 'First Name' },
        { path: 'basicInfo.lastName', weight: 10, name: 'Last Name' },
        { path: 'basicInfo.email', weight: 10, name: 'Email' },
        { path: 'basicInfo.phone', weight: 10, name: 'Phone' },
        { path: 'location.address', weight: 10, name: 'Street Address' },
        { path: 'location.zipCode', weight: 10, name: 'Zip Code' },
        { path: 'education.0', weight: 15, name: 'Education Entry' },
        { path: 'experience.0', weight: 15, name: 'Experience Entry' },
        { path: 'assets.0', weight: 10, name: 'Resume PDF' }
      ],
      SmartRecruiters: [
        { path: 'basicInfo.firstName', weight: 15, name: 'First Name' },
        { path: 'basicInfo.lastName', weight: 15, name: 'Last Name' },
        { path: 'basicInfo.email', weight: 20, name: 'Email' },
        { path: 'location.city', weight: 15, name: 'City' },
        { path: 'experience.0', weight: 15, name: 'Experience' },
        { path: 'assets.0', weight: 20, name: 'Resume PDF' }
      ],
      iCIMS: [
        { path: 'basicInfo.firstName', weight: 15, name: 'First Name' },
        { path: 'basicInfo.lastName', weight: 15, name: 'Last Name' },
        { path: 'basicInfo.email', weight: 20, name: 'Email' },
        { path: 'location.state', weight: 15, name: 'State' },
        { path: 'location.zipCode', weight: 15, name: 'Zip Code' },
        { path: 'assets.0', weight: 20, name: 'Resume PDF' }
      ],
      Taleo: [
        { path: 'basicInfo.firstName', weight: 15, name: 'First Name' },
        { path: 'basicInfo.lastName', weight: 15, name: 'Last Name' },
        { path: 'basicInfo.email', weight: 15, name: 'Email' },
        { path: 'education.0', weight: 20, name: 'Education' },
        { path: 'experience.0', weight: 20, name: 'Experience' },
        { path: 'assets.0', weight: 15, name: 'Resume PDF' }
      ],
      DefenseITAR: [
        { path: 'basicInfo.firstName', weight: 15, name: 'First Name' },
        { path: 'basicInfo.lastName', weight: 15, name: 'Last Name' },
        { path: 'basicInfo.email', weight: 15, name: 'Email' },
        { path: 'compliance.isITARUSPerson', weight: 30, name: 'US ITAR Person Status' },
        { path: 'compliance.securityClearance', weight: 25, name: 'Security Clearance' }
      ],
      Government: [
        { path: 'basicInfo.firstName', weight: 15, name: 'First Name' },
        { path: 'basicInfo.lastName', weight: 15, name: 'Last Name' },
        { path: 'basicInfo.email', weight: 15, name: 'Email' },
        { path: 'location.zipCode', weight: 15, name: 'Zip Code' },
        { path: 'workAuthorization.country', weight: 25, name: 'Citizenship Country' },
        { path: 'assets.0', weight: 15, name: 'Resume PDF' }
      ],
      Enterprise: [
        { path: 'basicInfo.firstName', weight: 10, name: 'First Name' },
        { path: 'basicInfo.lastName', weight: 10, name: 'Last Name' },
        { path: 'basicInfo.email', weight: 15, name: 'Email' },
        { path: 'professionalInfo.currentCompany', weight: 20, name: 'Current Company' },
        { path: 'professionalInfo.expectedSalary', weight: 20, name: 'Expected Salary' },
        { path: 'assets.0', weight: 25, name: 'Resume PDF' }
      ]
    };
  }

  /**
   * Calculates readiness scores across 10 hiring sectors and identifies missing field impacts.
   * @param {Object} profile - Candidate Profile MongoDB document or plain object
   * @returns {Object} { overallScore, atsBreakdown, missingFields }
   */
  calculateReadiness(profile) {
    if (!profile) {
      return { overallScore: 0, atsBreakdown: {}, missingFields: [] };
    }

    const atsBreakdown = {};
    const missingFieldSet = new Set();

    for (const [sector, reqs] of Object.entries(this.sectorRequirements)) {
      let score = 0;
      reqs.forEach(req => {
        // Resolve nested paths across UCKGraph or UserProfile
        const val = req.path.split('.').reduce((o, i) => o?.[i], profile);
        const hasValue = val !== undefined && val !== null && (Array.isArray(val) ? val.length > 0 : String(val).trim() !== '');
        
        if (hasValue) {
          score += req.weight;
        } else {
          missingFieldSet.add({ name: req.name, impactedSector: sector });
        }
      });
      atsBreakdown[sector] = Math.min(100, score);
    }

    const scoresArray = Object.values(atsBreakdown);
    const overallScore = scoresArray.length > 0 ? Math.round(scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length) : 0;

    return {
      overallScore,
      atsBreakdown,
      missingFields: Array.from(missingFieldSet)
    };
  }
}

module.exports = new ATSReadinessEngine();
