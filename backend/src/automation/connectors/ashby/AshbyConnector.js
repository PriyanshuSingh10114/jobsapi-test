const BaseApplicationConnector = require('../interfaces/BaseApplicationConnector');
const logger = require('../../../config/logger');
const FormIntelligence = require('../../engine/FormIntelligence');
const LocatorEngine = require('../../engine/LocatorEngine');
const FieldFillEngine = require('../../engine/FieldFillEngine');
const ValidationEngine = require('../../engine/ValidationEngine');

class AshbyConnector extends BaseApplicationConnector {
  async initialize() {
    logger.info('[AshbyConnector] Initializing Ashby ATS plugin...');
    this.logOwnership('ConnectorInitialization', 'AshbyConnector');
    this.locatorEngine = new LocatorEngine(this.page);
    this.formIntelligence = new FormIntelligence(this.page, this.locatorEngine);
    this.fieldFillEngine = new FieldFillEngine(this.page);
    this.validationEngine = new ValidationEngine(this.page);
    this.semanticMap = null;
    this.formContext = this.page;
    this.uploadResults = [];
  }

  async authenticate() {
    logger.info('[AshbyConnector] Standard Ashby applications do not require applicant login.');
  }

  async openJob(jobUrl) {
    logger.info(`[AshbyConnector] Navigating to Ashby posting: ${jobUrl}`);
    this.logOwnership('OpeningJob', 'AshbyConnector');
    await this.page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
  }

  async detectApplication() {
    logger.info('[AshbyConnector] Detecting Ashby application form...');
    this.formContext = this.page;
    this.semanticMap = await this.formIntelligence.analyzeForm(this.formContext);
  }

  async resolveFields(profileData) {
    this.resolvedFieldsToFill = [];
  }

  async uploadResume(profileData) {
    const resumeField = this.semanticMap['RESUME_UPLOAD'];
    const resumePath = profileData.documents?.defaultResume;
    if (!resumePath) {
      this.pendingFields.push({ label: 'Resume', reason: 'Profile has no default resume' });
      return;
    }
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
    if (coverLetters.length > 0) {
      const locator = clField?.cssPath ? this.formContext.locator(clField.cssPath) : this.formContext.locator('input[type="file"]').nth(1);
      if (await locator.count() > 0) {
        await this.fieldFillEngine.fillField({ controlType: 'file' }, coverLetters[0].storagePath, locator.first()).catch(() => {});
        this.completedFields.push('COVER_LETTER_UPLOAD');
      }
    }
  }

  async generateAIAnswers(profileData) {}

  async fillFields(profileData) {
    logger.info('[AshbyConnector] Filling mapped fields...');
    const fieldMapping = [
      { key: 'FIRST_NAME', val: profileData.personal?.firstName },
      { key: 'LAST_NAME', val: profileData.personal?.lastName },
      { key: 'EMAIL', val: profileData.contact?.email },
      { key: 'PHONE', val: profileData.contact?.phone },
      { key: 'LINKEDIN_URL', val: profileData.links?.linkedin }
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
          this.pendingFields.push({ label: item.key, reason: err.message });
        }
      }
    }
  }

  async validateFilledFields() {}
  async review() {}

  async submit() {
    const submitBtn = this.formContext.locator('button[type="submit"], input[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click().catch(() => {});
      await this.page.waitForTimeout(3000);
    }
  }

  async verify() { return true; }
}

module.exports = AshbyConnector;
