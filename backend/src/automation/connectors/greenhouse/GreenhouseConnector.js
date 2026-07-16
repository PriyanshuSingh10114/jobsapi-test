const BaseApplicationConnector = require('../interfaces/BaseApplicationConnector');
const logger = require('../../../config/logger');
const FormIntelligence = require('../../engine/FormIntelligence');
const LocatorEngine = require('../../engine/LocatorEngine');
const ScreenshotManager = require('../../managers/ScreenshotManager');
const UploadManager = require('../../managers/UploadManager');

class GreenhouseConnector extends BaseApplicationConnector {
  async initialize() {
    logger.info('Initializing GreenhouseConnector with Intelligence Engines...');
    this.locatorEngine = new LocatorEngine(this.page);
    this.formIntelligence = new FormIntelligence(this.page, this.locatorEngine);
    this.uploadManager = new UploadManager(this.page);
    
    const sessionId = this.sessionData ? this.sessionData.sessionId : `anon_${Date.now()}`;
    this.screenshotManager = new ScreenshotManager(this.page, sessionId);
    
    this.semanticMap = null;
  }

  async authenticate() {
    logger.info('Greenhouse usually does not require authentication for applicants.');
  }

  async openJob(jobUrl) {
    logger.info(`Opening Greenhouse job: ${jobUrl}`);
    await this.page.goto(jobUrl, { waitUntil: 'networkidle' });
  }

  async detectApplication() {
    await this.page.waitForSelector('#application_form', { state: 'attached', timeout: 15000 }).catch(() => {});
    const formExists = await this.page.locator('#application_form').count() > 0;
    if (!formExists) {
      throw new Error('Application form not found on page.');
    }
    logger.info('Greenhouse application form detected.');

    // Build the semantic map of the DOM
    this.semanticMap = await this.formIntelligence.analyzeForm();
  }

  async uploadResume(resumePath) {
    if (!resumePath) return;
    logger.info(`Uploading resume: ${resumePath}`);
    
    const resumeField = this.semanticMap['RESUME_UPLOAD'];
    let inputLocator;
    
    if (resumeField && resumeField.id) {
       inputLocator = this.page.locator(`#${resumeField.id}`);
    } else {
       logger.warn('FormIntelligence missed resume upload; using semantic fallback strategy.');
       inputLocator = this.page.locator('input[type="file"][data-source="resume"], input[type="file"][aria-label*="resume" i]');
    }
    
    if (await inputLocator.count() > 0) {
       await this.uploadManager.uploadFile(inputLocator.first(), resumePath);
    } else {
       logger.warn('Resume file input completely missing from DOM.');
    }
  }

  async uploadCoverLetter(coverLetterPath) {
    if (!coverLetterPath) return;
    logger.info(`Uploading cover letter: ${coverLetterPath}`);
    
    const clField = this.semanticMap['COVER_LETTER_UPLOAD'];
    let inputLocator;
    
    if (clField && clField.id) {
       inputLocator = this.page.locator(`#${clField.id}`);
    } else {
       inputLocator = this.page.locator('input[type="file"][data-source="cover_letter"], input[type="file"][aria-label*="cover letter" i]');
    }
    
    if (await inputLocator.count() > 0) {
       await this.uploadManager.uploadFile(inputLocator.first(), coverLetterPath);
    }
  }

  async fillProfile(profileData) {
    logger.info('Filling basic profile data using Form Intelligence Semantic Map...');
    
    const fillField = async (semanticKey, value) => {
       if (!value) return;
       const field = this.semanticMap[semanticKey];
       if (field) {
          try {
             if (field.id) {
                await this.page.fill(`#${field.id}`, value);
             } else if (field.name) {
                await this.page.fill(`[name="${field.name}"]`, value);
             }
             logger.info(`Successfully filled semantic field: ${semanticKey}`);
          } catch (err) {
             logger.warn(`Failed to fill ${semanticKey}: ${err.message}`);
          }
       } else {
          logger.warn(`Semantic map missing key: ${semanticKey}. Field might not exist on this specific form.`);
       }
    };

    await fillField('FIRST_NAME', profileData.firstName);
    await fillField('LAST_NAME', profileData.lastName);
    await fillField('EMAIL', profileData.email);
    await fillField('PHONE', profileData.phone);
    await fillField('LINKEDIN_URL', profileData.linkedin);
    await fillField('WEBSITE_URL', profileData.portfolio);
  }

  async answerQuestions(profileData) {
    logger.info('Answering custom questions...');
    // Future LLM-driven question answering goes here.
  }

  async review() {
    logger.info('Reviewing application (Greenhouse is typically single page)...');
  }

  async submit() {
    logger.info('Submitting application...');
    // await this.page.click('#submit_app');
    logger.warn('Submit bypassed for safety in POC.');
  }

  async verify() {
    logger.info('Verifying submission...');
    // Wait for confirmation message or redirect
  }

  async captureEvidence(type, checkpoint) {
    if (type === 'Screenshot' && this.screenshotManager) {
      await this.screenshotManager.capture(checkpoint);
    } else {
      logger.info(`Capturing evidence fallback: ${type} at ${checkpoint}`);
    }
  }
}

module.exports = GreenhouseConnector;
