const logger = require('../../config/logger');

// Central Declarative Registry
const SemanticMappingRegistry = {
    // Basic Info
    'FIRST_NAME': ['personal.firstName', 'personal.preferredName'],
    'LAST_NAME': ['personal.lastName'],
    'PREFERRED_NAME': ['personal.preferredName', 'personal.firstName'],
    'NICKNAME': ['personal.preferredName', 'personal.firstName'],
    'DISPLAY_NAME': ['personal.preferredName', 'personal.firstName'],
    'EMAIL': ['contact.email', 'contact.secondaryEmail'],
    'PHONE': ['contact.phone'],
    
    // Location
    'COUNTRY': ['location.country', 'contact.country'],
    'COUNTRY_OF_RESIDENCE': ['location.country'],
    'CURRENT_COUNTRY': ['location.country'],
    'NATIONALITY': ['location.country', 'workAuthorization.country'],
    'STATE': ['location.state', 'contact.state'],
    'CITY': ['location.city', 'contact.city'],
    'ZIP': ['location.zipCode', 'contact.zipCode'],
    
    // Links
    'LINKEDIN_URL': ['links.linkedin'],
    'GITHUB_URL': ['links.github'],
    'PORTFOLIO_URL': ['links.portfolio', 'links.personalWebsite'],
    'WEBSITE': ['links.personalWebsite', 'links.portfolio'],
    'TWITTER_URL': ['links.twitter'],
    
    // Work Auth
    'WORK_AUTHORIZATION': ['workAuthorization.authorized'],
    'CITIZENSHIP': ['workAuthorization.country', 'location.country'],
    'SECURITY_CLEARANCE': ['preferences.securityClearance', 'workAuthorization.securityClearance'],
    
    // Demographics
    'GENDER': ['demographics.gender', 'voluntary.gender', 'personal.gender'],
    'RACE': ['demographics.race', 'voluntary.race'],
    'VETERAN': ['demographics.veteran', 'voluntary.veteran'],
    'DISABILITY': ['demographics.disability', 'voluntary.disability'],
    
    // Preferences
    'EXPECTED_SALARY': ['preferences.salaryExpectations', 'preferences.expectedSalary'],
    'CURRENT_SALARY': ['preferences.currentSalary'],
    'NOTICE_PERIOD': ['preferences.noticePeriod'],

    // Education
    'EDUCATION_SCHOOL': ['education.0.school', 'education.0.institution'],
    'EDUCATION_DEGREE': ['education.0.degree', 'education.0.qualification'],
    'EDUCATION_DISCIPLINE': ['education.0.discipline', 'education.0.major'],
    'EDUCATION_GPA': ['education.0.gpa', 'education.0.score'],
    'EDUCATION_GRAD_YEAR': ['education.0.graduationDate'],

    // Test Scores
    'TEST_SAT': ['tests.sat', 'education.0.sat'],
    'TEST_GRE': ['tests.gre', 'education.0.gre'],
    'TEST_ACT': ['tests.act', 'education.0.act'],

    // Assets
    'RESUME_UPLOAD': ['documents.defaultResume'],
    'COVER_LETTER_UPLOAD': ['documents.coverLetters.0.storagePath']
};

class CandidateResolutionEngine {
    constructor(profileData, aiAnswerEngine) {
        this.profile = profileData;
        this.aiAnswerEngine = aiAnswerEngine;
        this.resolutionReport = {
            detectedFields: 0,
            resolvedCount: 0,
            skippedCount: 0,
            logs: []
        };
    }

    /**
     * Helper to resolve dot-notation paths in an object.
     * @param {Object} obj - The object to search.
     * @param {string} path - The dot-notation path (e.g. 'location.country').
     */
    _resolvePath(obj, path) {
        return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
    }

    /**
     * Resolves the best value for a semantic key using declarative mapping and custom fallbacks.
     * @param {string} semanticKey - The classified semantic key (e.g., 'COUNTRY', 'EDUCATION_SCHOOL')
     * @param {Object} field - The raw field context for AI prompt generation/logging
     * @returns {Promise<string|null>} - The resolved value, or null if unresolvable
     */
    async resolveValue(semanticKey, field = {}) {
        if (!semanticKey) return null;
        this.resolutionReport.detectedFields++;

        let resolvedValue = null;
        let resolvedPath = null;
        let skipReason = null;

        try {
            // 1. Array-based Computations (Education)
            if (semanticKey.startsWith('EDUCATION_')) {
                const eduArray = this.profile.education || [];
                if (eduArray.length > 0) {
                    const latestEdu = eduArray[0]; // Pre-sorted by ProfileResolver
                    if (semanticKey === 'EDUCATION_SCHOOL') { resolvedValue = latestEdu.school; resolvedPath = 'education[0].school'; }
                    else if (semanticKey === 'EDUCATION_DEGREE' || semanticKey === 'DEGREE') { resolvedValue = latestEdu.degree; resolvedPath = 'education[0].degree'; }
                    else if (semanticKey === 'EDUCATION_DISCIPLINE' || semanticKey === 'DISCIPLINE') { resolvedValue = latestEdu.discipline; resolvedPath = 'education[0].discipline'; }
                    else if (semanticKey === 'EDUCATION_GPA' || semanticKey === 'GPA') { resolvedValue = latestEdu.gpa; resolvedPath = 'education[0].gpa'; }
                    else if (semanticKey === 'EDUCATION_GRAD_YEAR' || semanticKey === 'GRADUATION_DATE') {
                        if (latestEdu.graduationDate) {
                            resolvedValue = new Date(latestEdu.graduationDate).getFullYear().toString();
                            resolvedPath = 'education[0].graduationDate (computed)';
                        }
                    }
                }
            }
            // 2. Array-based Computations (Experience)
            else if (semanticKey.startsWith('EXPERIENCE_') || semanticKey === 'CURRENT_COMPANY' || semanticKey === 'JOB_TITLE' || semanticKey === 'YEARS_EXPERIENCE') {
                const expArray = this.profile.experience || [];
                if (expArray.length > 0) {
                    const latestExp = expArray[0];
                    if (semanticKey === 'EXPERIENCE_TITLE' || semanticKey === 'JOB_TITLE') { resolvedValue = latestExp.title; resolvedPath = 'experience[0].title'; }
                    else if (semanticKey === 'EXPERIENCE_COMPANY' || semanticKey === 'CURRENT_COMPANY') { resolvedValue = latestExp.company; resolvedPath = 'experience[0].company'; }
                    else if (semanticKey === 'EXPERIENCE_YEARS' || semanticKey === 'YEARS_EXPERIENCE') { 
                        resolvedValue = this._calculateTotalExperience(expArray); 
                        resolvedPath = 'experience (computed sum)';
                    }
                }
            }
            // 3. AI Answer Engine
            else if (semanticKey.startsWith('AI_')) {
                if (this.aiAnswerEngine) {
                    resolvedValue = await this.aiAnswerEngine.resolveAnswer(semanticKey, field);
                    resolvedPath = 'AIAnswerEngine';
                }
            }
            // 4. Registry Fallback Pathing
            else {
                const paths = SemanticMappingRegistry[semanticKey] || [];
                for (const path of paths) {
                    const value = this._resolvePath(this.profile, path);
                    if (value && String(value).trim() !== '') {
                        // WorkAuth Boolean to String mapping
                        if (typeof value === 'boolean') {
                            resolvedValue = value ? 'Yes' : 'No';
                        } else {
                            resolvedValue = value;
                        }
                        resolvedPath = path;
                        break; // Stop at first valid match!
                    }
                }
            }

            // Fallback for voluntary fields
            if (!resolvedValue && semanticKey.startsWith('VOLUNTARY_')) {
                resolvedValue = 'Prefer not to say';
                resolvedPath = 'Fallback Default';
            }

            if (!resolvedValue) {
                skipReason = 'Missing Profile Data';
            }

        } catch (error) {
            logger.error(`CRE Error resolving ${semanticKey}: ${error.message}`);
            skipReason = `Error: ${error.message}`;
        }

        // Build Telemetry Log
        this.resolutionReport.logs.push({
            fieldLabel: field.labelText || field.name || 'Unknown',
            semanticKey: semanticKey,
            resolvedPath: resolvedPath || 'None',
            resolvedValue: resolvedValue,
            status: resolvedValue ? 'Success' : 'Failed',
            reason: skipReason
        });

        if (resolvedValue) {
            this.resolutionReport.resolvedCount++;
        } else {
            this.resolutionReport.skippedCount++;
        }

        return resolvedValue;
    }

    getResolutionReport() {
        return this.resolutionReport;
    }

    _calculateTotalExperience(expArray) {
        let totalMonths = 0;
        expArray.forEach(exp => {
            const start = new Date(exp.startDate);
            const end = exp.endDate ? new Date(exp.endDate) : new Date();
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const diff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                totalMonths += diff > 0 ? diff : 0;
            }
        });
        const years = Math.floor(totalMonths / 12);
        return years > 0 ? years.toString() : '0';
    }
}

module.exports = CandidateResolutionEngine;
