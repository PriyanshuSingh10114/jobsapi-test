const BaseApplicationConnector = require('../interfaces/BaseApplicationConnector');
const logger = require('../../../config/logger');
const FormIntelligence = require('../../engine/FormIntelligence');
const LocatorEngine = require('../../engine/LocatorEngine');
const FieldFillEngine = require('../../engine/FieldFillEngine');
const ValidationEngine = require('../../engine/ValidationEngine');

class WorkdayConnector extends BaseApplicationConnector {
  async initialize() {
    logger.info('[WorkdayConnector] Initializing Workday ATS plugin...');
    this.logOwnership('ConnectorInitialization', 'WorkdayConnector');
    this.locatorEngine = new LocatorEngine(this.page);
    this.formIntelligence = new FormIntelligence(this.page, this.locatorEngine);
    this.fieldFillEngine = new FieldFillEngine(this.page);
    this.validationEngine = new ValidationEngine(this.page);
    this.semanticMap = null;
    this.formContext = this.page;
    this.uploadResults = [];
  }

  async authenticate() {
    logger.info('[WorkdayConnector] Workday guest or quick apply handling...');
  }

  async openJob(jobUrl) {
    logger.info(`[WorkdayConnector] Navigating to Workday posting: ${jobUrl}`);
    this.logOwnership('OpeningJob', 'WorkdayConnector');
    await this.page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
  }

  async detectApplication() {
    logger.info('[WorkdayConnector] Detecting Workday application form & multi-step wizard...');
    const applyButton = this.page.locator('[data-automation-id="applyButton"], a[href*="apply"]').first();
    if (await applyButton.count() > 0) {
      await applyButton.click().catch(() => {});
      await this.page.waitForTimeout(3000);
    }
    this.formContext = this.page;
    this.semanticMap = await this.formIntelligence.analyzeForm(this.formContext);
  }

  async resolveFields(profileData) {
    this.resolvedFieldsToFill = [];
  }

  async uploadResume(profileData) {
    const resumePath = profileData.documents?.defaultResume;
    if (!resumePath) {
      this.pendingFields.push({ label: 'Resume', reason: 'Profile has no default resume' });
      return;
    }
    const fileInput = this.formContext.locator('input[type="file"], [data-automation-id="file-upload-drop-zone"] input').first();
    if (await fileInput.count() > 0) {
      try {
        await this.fieldFillEngine.fillField({ controlType: 'file' }, resumePath, fileInput);
        await this.page.waitForTimeout(1500);
        this.completedFields.push('RESUME_UPLOAD');
        this.uploadResults.push({ type: 'Resume', verified: true, path: resumePath, method: 'Workday_DropZone' });
      } catch (err) {
        this.pendingFields.push({ label: 'Resume', reason: err.message });
      }
    }
  }

  async uploadCoverLetter(profileData) {}
  async generateAIAnswers(profileData) {}

  async fillFields(profileData) {
    logger.info('[WorkdayConnector] Filling Workday step fields...');
    const fieldMapping = [
      { key: 'FIRST_NAME', val: profileData.personal?.firstName },
      { key: 'LAST_NAME', val: profileData.personal?.lastName },
      { key: 'EMAIL', val: profileData.contact?.email },
      { key: 'PHONE', val: profileData.contact?.phone },
      { key: 'ADDRESS', val: profileData.location?.address },
      { key: 'CITY', val: profileData.location?.city }
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
    const submitBtn = this.formContext.locator('[data-automation-id="bottom-navigation-next-button"], [data-automation-id="page-submission-button"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click().catch(() => {});
      await this.page.waitForTimeout(3000);
    }
  }

  async verify() { return true; }
}

module.exports = WorkdayConnector;
