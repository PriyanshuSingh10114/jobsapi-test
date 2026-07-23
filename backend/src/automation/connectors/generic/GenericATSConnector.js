const BaseApplicationConnector = require('../interfaces/BaseApplicationConnector');
const logger = require('../../../config/logger');
const FormIntelligence = require('../../engine/FormIntelligence');
const LocatorEngine = require('../../engine/LocatorEngine');
const FieldFillEngine = require('../../engine/FieldFillEngine');
const ValidationEngine = require('../../engine/ValidationEngine');
const AIQuestionEngine = require('../../engine/AIQuestionEngine');
const LearningEngine = require('../../engine/LearningEngine');

class GenericATSConnector extends BaseApplicationConnector {
  async initialize() {
    logger.info('[GenericATSConnector] Initializing Universal Generic ATS plugin...');
    this.logOwnership('ConnectorInitialization', 'GenericATSConnector');
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
    logger.info(`[GenericATSConnector] Navigating to job page: ${jobUrl}`);
    this.logOwnership('OpeningJob', 'GenericATSConnector');
    await this.page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
  }

  async detectApplication() {
    logger.info('[GenericATSConnector] Scanning DOM for custom application forms or modals...');
    
    // Check if there is an Apply button or modal pop-up
    const applyRegex = /(apply now|apply for this role|apply for this job|start application|apply)/i;
    await this.page.waitForSelector('a, button', { state: 'attached', timeout: 3000 }).catch(() => {});
    const applyButton = this.page.locator('a, button').filter({ hasText: applyRegex }).first();

    if (await applyButton.count() > 0) {
      await Promise.all([
        this.page.waitForLoadState('domcontentloaded').catch(() => {}),
        applyButton.click()
      ]).catch(() => {});
      await this.page.waitForTimeout(2000);
    }

    // Inspect frames for embedded form
    const frames = this.page.frames();
    let bestFrame = this.page;
    let maxControls = 0;

    for (const frame of frames) {
      try {
        const count = await frame.locator('input, select, textarea').count();
        if (count > maxControls) {
          maxControls = count;
          bestFrame = frame;
        }
      } catch (e) {}
    }

    this.formContext = bestFrame;
    this.semanticMap = await this.formIntelligence.analyzeForm(this.formContext);

    // Track unmapped custom fields for platform learning
    const unmapped = (this.formIntelligence.allFields || []).filter(f => !f.semanticKey || f.semanticKey.startsWith('CUSTOM_QUESTION'));
    await LearningEngine.recordUnmappedFields('generic', unmapped, this.page.url());
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
    logger.info(`[GenericATSConnector] Uploading resume: ${resumePath}`);

    const locator = resumeField?.cssPath ? this.formContext.locator(resumeField.cssPath) : this.formContext.locator('input[type="file"]').first();

    if (await locator.count() > 0) {
      try {
        await this.fieldFillEngine.fillField({ controlType: 'file' }, resumePath, locator.first());
        await this.page.waitForTimeout(1000);
        this.completedFields.push('RESUME_UPLOAD');
        this.uploadResults.push({ type: 'Resume', verified: true, path: resumePath, method: 'Generic_Upload' });
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
          this.uploadResults.push({ type: 'CoverLetter', verified: true, path: coverLetterPath, method: 'Generic_Upload' });
        } catch (e) {}
      }
    }
  }

  async generateAIAnswers(profileData) {
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
    logger.info('[GenericATSConnector] Filling mapped form fields...');
    const fieldMapping = [
      { key: 'FIRST_NAME', val: profileData.personal?.firstName },
      { key: 'LAST_NAME', val: profileData.personal?.lastName },
      { key: 'EMAIL', val: profileData.contact?.email },
      { key: 'PHONE', val: profileData.contact?.phone },
      { key: 'CITY', val: profileData.location?.city },
      { key: 'COUNTRY', val: profileData.location?.country },
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

  async validateFilledFields() {}
  async review() {}

  async submit() {
    const submitBtn = this.formContext.locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Send")').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click().catch(() => {});
      await this.page.waitForTimeout(3000);
    }
  }

  async verify() { return true; }
}

module.exports = GenericATSConnector;
