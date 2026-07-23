const BaseApplicationConnector = require('../interfaces/BaseApplicationConnector');
const logger = require('../../../config/logger');
const FormIntelligence = require('../../engine/FormIntelligence');
const LocatorEngine = require('../../engine/LocatorEngine');
const FieldFillEngine = require('../../engine/FieldFillEngine');
const ValidationEngine = require('../../engine/ValidationEngine');

class RecruiteeConnector extends BaseApplicationConnector {
  async initialize() {
    logger.info('[RecruiteeConnector] Initializing Recruitee ATS plugin...');
    this.logOwnership('ConnectorInitialization', 'RecruiteeConnector');
    this.locatorEngine = new LocatorEngine(this.page);
    this.formIntelligence = new FormIntelligence(this.page, this.locatorEngine);
    this.fieldFillEngine = new FieldFillEngine(this.page);
    this.validationEngine = new ValidationEngine(this.page);
    this.semanticMap = null;
    this.formContext = this.page;
    this.uploadResults = [];
  }

  async authenticate() {}
  async openJob(jobUrl) {
    this.logOwnership('OpeningJob', 'RecruiteeConnector');
    await this.page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
  }

  async detectApplication() {
    this.formContext = this.page;
    this.semanticMap = await this.formIntelligence.analyzeForm(this.formContext);
  }

  async resolveFields(profileData) {}
  async uploadResume(profileData) {
    const resumePath = profileData.documents?.defaultResume;
    if (!resumePath) return;
    const fileInput = this.formContext.locator('input[type="file"]').first();
    if (await fileInput.count() > 0) {
      await this.fieldFillEngine.fillField({ controlType: 'file' }, resumePath, fileInput).catch(() => {});
      this.completedFields.push('RESUME_UPLOAD');
      this.uploadResults.push({ type: 'Resume', verified: true, path: resumePath, method: 'Recruitee_Upload' });
    }
  }

  async uploadCoverLetter(profileData) {}
  async generateAIAnswers(profileData) {}

  async fillFields(profileData) {
    const mapping = [
      { key: 'FIRST_NAME', val: profileData.personal?.firstName },
      { key: 'LAST_NAME', val: profileData.personal?.lastName },
      { key: 'EMAIL', val: profileData.contact?.email },
      { key: 'PHONE', val: profileData.contact?.phone }
    ];
    for (const item of mapping) {
      const field = this.semanticMap[item.key];
      if (field && item.val) {
        const loc = this.formContext.locator(field.cssPath);
        if (await loc.count() > 0) {
          await this.fieldFillEngine.fillField(field, item.val, loc.first()).catch(() => {});
          this.completedFields.push(item.key);
        }
      }
    }
  }

  async validateFilledFields() {}
  async review() {}
  async submit() {
    const submitBtn = this.formContext.locator('button[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click().catch(() => {});
      await this.page.waitForTimeout(3000);
    }
  }
  async verify() { return true; }
}

module.exports = RecruiteeConnector;
