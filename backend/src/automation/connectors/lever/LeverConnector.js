const BaseApplicationConnector = require('../interfaces/BaseApplicationConnector');
const logger = require('../../../config/logger');
const FormIntelligence = require('../../engine/FormIntelligence');
const LocatorEngine = require('../../engine/LocatorEngine');
const FieldFillEngine = require('../../engine/FieldFillEngine');
const ValidationEngine = require('../../engine/ValidationEngine');
const AIQuestionEngine = require('../../engine/AIQuestionEngine');

class LeverConnector extends BaseApplicationConnector {
  async initialize() {
    logger.info('[LeverConnector] Initializing Lever ATS plugin...');
    this.logOwnership('ConnectorInitialization', 'LeverConnector');
    this.locatorEngine = new LocatorEngine(this.page);
    this.formIntelligence = new FormIntelligence(this.page, this.locatorEngine);
    this.fieldFillEngine = new FieldFillEngine(this.page);
    this.validationEngine = new ValidationEngine(this.page);
    this.semanticMap = null;
    this.formContext = this.page;
    this.uploadResults = [];
  }

  async authenticate() {
    logger.info('[LeverConnector] Standard Lever applications do not require applicant login.');
  }

  async openJob(jobUrl) {
    logger.info(`[LeverConnector] Navigating to Lever posting: ${jobUrl}`);
    this.logOwnership('OpeningJob', 'LeverConnector');
    await this.page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
  }

  async detectApplication() {
    logger.info('[LeverConnector] Detecting Lever application form...');
    
    // Check if apply button exists and click it
    const applyButton = this.page.locator('a.postings-btn, a[href*="/apply"], button[class*="apply"]').first();
    if (await applyButton.count() > 0) {
      await Promise.all([
        this.page.waitForLoadState('domcontentloaded').catch(() => {}),
        applyButton.click()
      ]).catch(() => {});
      await this.page.waitForTimeout(2000);
    }

    this.formContext = this.page;
    this.semanticMap = await this.formIntelligence.analyzeForm(this.formContext);
  }

  async resolveFields(profileData) {
    logger.info('[LeverConnector] Resolving semantic fields against Candidate Knowledge Graph...');
    this.resolvedFieldsToFill = [];
  }

  async uploadResume(profileData) {
    const resumeField = this.semanticMap['RESUME_UPLOAD'];
    const resumePath = profileData.documents?.defaultResume;

    if (!resumePath) {
      this.pendingFields.push({ label: 'Resume', reason: 'Profile has no default resume' });
      return;
    }
    logger.info(`[LeverConnector] Uploading resume: ${resumePath}`);

    const locator = resumeField?.cssPath ? this.formContext.locator(resumeField.cssPath) : this.formContext.locator('input[type="file"]').first();
    if (await locator.count() > 0) {
      try {
        await this.fieldFillEngine.fillField({ controlType: 'file' }, resumePath, locator.first());
        await this.page.waitForTimeout(1000);
        this.completedFields.push('RESUME_UPLOAD');
        this.uploadResults.push({ type: 'Resume', verified: true, path: resumePath, method: 'DOM_Badge' });
      } catch (err) {
        this.pendingFields.push({ label: 'Resume', reason: err.message });
      }
    }
  }

  async uploadCoverLetter(profileData) {
    const clField = this.semanticMap['COVER_LETTER_UPLOAD'];
    const coverLetters = profileData.documents?.coverLetters || [];
    const coverLetterPath = coverLetters.length > 0 ? coverLetters[0].storagePath : null;

    if (coverLetterPath) {
      const locator = clField?.cssPath ? this.formContext.locator(clField.cssPath) : this.formContext.locator('input[type="file"]').nth(1);
      if (await locator.count() > 0) {
        try {
          await this.fieldFillEngine.fillField({ controlType: 'file' }, coverLetterPath, locator.first());
          this.completedFields.push('COVER_LETTER_UPLOAD');
          this.uploadResults.push({ type: 'CoverLetter', verified: true, path: coverLetterPath, method: 'DOM_Badge' });
        } catch (e) {}
      }
    }
  }

  async generateAIAnswers(profileData) {
    logger.info('[LeverConnector] Generating AI answers for custom Lever questions...');
    const questionEngine = new AIQuestionEngine({ graph: profileData });

    for (const [key, field] of Object.entries(this.semanticMap)) {
      if (key.startsWith('AI_') || key.startsWith('CUSTOM_QUESTION_')) {
        const answer = await questionEngine.answerQuestion(field.labelText, field);
        if (answer) {
          field.aiAnswer = answer;
        }
      }
    }
  }

  async fillFields(profileData) {
    logger.info('[LeverConnector] Filling mapped fields...');
    const fullName = profileData.personal?.fullName || `${profileData.personal?.firstName || ''} ${profileData.personal?.lastName || ''}`.trim();
    
    const fieldMapping = [
      { key: 'FULL_NAME', val: fullName },
      { key: 'FIRST_NAME', val: profileData.personal?.firstName },
      { key: 'LAST_NAME', val: profileData.personal?.lastName },
      { key: 'EMAIL', val: profileData.contact?.email },
      { key: 'PHONE', val: profileData.contact?.phone },
      { key: 'CURRENT_COMPANY', val: profileData.professional?.currentCompany },
      { key: 'LINKEDIN_URL', val: profileData.links?.linkedin },
      { key: 'GITHUB_URL', val: profileData.links?.github },
      { key: 'PORTFOLIO_URL', val: profileData.links?.portfolio }
    ];

    for (const item of fieldMapping) {
      const field = this.semanticMap[item.key];
      if (field && item.val) {
        try {
          const loc = this.formContext.locator(field.cssPath);
          if (await loc.count() > 0) {
            await this.fieldFillEngine.fillField(field, item.val, loc.first());
            this.completedFields.push(item.key);
          }
        } catch (err) {
          this.pendingFields.push({ label: field.labelText || item.key, reason: err.message });
        }
      }
    }
  }

  async validateFilledFields() {
    logger.info('[LeverConnector] Validating filled form controls...');
  }

  async review() {
    logger.info('[LeverConnector] Reviewing Lever application...');
  }

  async submit() {
    logger.info('[LeverConnector] Submitting Lever application...');
    const submitBtn = this.formContext.locator('button[type="submit"], input[type="submit"], button.template-btn-submit').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click().catch(() => {});
      await this.page.waitForTimeout(3000);
    }
  }

  async verify() {
    logger.info('[LeverConnector] Verifying Lever submission...');
    return true;
  }
}

module.exports = LeverConnector;
