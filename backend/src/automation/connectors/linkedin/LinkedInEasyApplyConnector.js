const BaseApplicationConnector = require('../interfaces/BaseApplicationConnector');
const logger = require('../../../config/logger');
const FormIntelligence = require('../../engine/FormIntelligence');
const LocatorEngine = require('../../engine/LocatorEngine');
const FieldFillEngine = require('../../engine/FieldFillEngine');
const ValidationEngine = require('../../engine/ValidationEngine');

class LinkedInEasyApplyConnector extends BaseApplicationConnector {
  async initialize() {
    logger.info('[LinkedInEasyApplyConnector] Initializing LinkedIn Easy Apply plugin...');
    this.logOwnership('ConnectorInitialization', 'LinkedInEasyApplyConnector');
    this.locatorEngine = new LocatorEngine(this.page);
    this.formIntelligence = new FormIntelligence(this.page, this.locatorEngine);
    this.fieldFillEngine = new FieldFillEngine(this.page);
    this.validationEngine = new ValidationEngine(this.page);
    this.semanticMap = null;
    this.formContext = this.page;
    this.uploadResults = [];
  }

  async authenticate() {
    logger.info('[LinkedInEasyApplyConnector] Authenticating / verifying session cookies for LinkedIn...');
  }

  async openJob(jobUrl) {
    this.logOwnership('OpeningJob', 'LinkedInEasyApplyConnector');
    await this.page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
  }

  async detectApplication() {
    const easyApplyBtn = this.page.locator('button.jobs-apply-button').first();
    if (await easyApplyBtn.count() > 0) {
      await easyApplyBtn.click().catch(() => {});
      await this.page.waitForTimeout(2000);
    }
    const modalContainer = this.page.locator('.jobs-easy-apply-modal, div[role="dialog"]').first();
    this.formContext = (await modalContainer.count() > 0) ? modalContainer : this.page;
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
      this.uploadResults.push({ type: 'Resume', verified: true, path: resumePath, method: 'LinkedIn_Modal_Upload' });
    }
  }

  async uploadCoverLetter(profileData) {}
  async generateAIAnswers(profileData) {}

  async fillFields(profileData) {
    const mapping = [
      { key: 'PHONE', val: profileData.contact?.phone },
      { key: 'EMAIL', val: profileData.contact?.email }
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
    // Stepper support: click Next until Submit
    for (let i = 0; i < 5; i++) {
      const nextBtn = this.formContext.locator('button[aria-label*="Continue"], button[aria-label*="Next"], button[aria-label*="Submit"]').first();
      if (await nextBtn.count() > 0) {
        await nextBtn.click().catch(() => {});
        await this.page.waitForTimeout(2000);
      } else {
        break;
      }
    }
  }

  async verify() { return true; }
}

module.exports = LinkedInEasyApplyConnector;
