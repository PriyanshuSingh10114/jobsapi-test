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
    
    const browserSessionId = this.sessionData ? this.sessionData.sessionId : null;
    this.screenshotManager = new ScreenshotManager(this.page, this.applicationSessionId, browserSessionId);
    
    this.semanticMap = null;
    this.formContext = this.page; // Default context is the top-level page
  }

  async authenticate() {
    logger.info('Greenhouse usually does not require authentication for applicants.');
  }

  async openJob(jobUrl) {
    logger.info(`Opening Greenhouse job: ${jobUrl}`);
    await this.page.goto(jobUrl, { waitUntil: 'domcontentloaded' });
  }

  async detectApplication() {
    logger.info('Attempting to detect Greenhouse application form...');
    
    // Check if there is an Apply button we need to click first
    const applyRegex = /(apply now|apply for this role|apply for this job|apply)/i;
    
    // Wait briefly for a potential apply button
    await this.page.waitForSelector('text=/apply now|apply for this role|apply for this job|apply/i', { state: 'attached', timeout: 5000 }).catch(() => {});
    const applyButton = this.page.locator('a, button').filter({ hasText: applyRegex }).first();
    
    if (await applyButton.count() > 0) {
      logger.info('Found "Apply" button. Clicking and waiting for navigation/form...');
      await Promise.all([
        this.page.waitForLoadState('domcontentloaded').catch(() => {}),
        applyButton.click()
      ]);
      await this.page.waitForTimeout(3000); // Wait for dynamic iframes/modals
    }

    // Semantic Frame Scoring
    const frames = this.page.frames();
    logger.info(`Enumerating ${frames.length} frames to find the application form...`);
    
    let bestFrame = null;
    let bestScore = -1;

    for (const frame of frames) {
      try {
        const url = frame.url();
        const name = frame.name() || 'unnamed';
        
        const formsCount = await frame.locator('form').count();
        if (formsCount === 0) continue; // Skip frames without forms
        
        const inputsCount = await frame.locator('input').count();
        const fileInputsCount = await frame.locator('input[type="file"]').count();
        const buttonsCount = await frame.locator('button').count();
        
        logger.info(`Frame: ${name} | URL: ${url.substring(0, 60)}... | Forms: ${formsCount} | Inputs: ${inputsCount} | File: ${fileInputsCount} | Buttons: ${buttonsCount}`);
        
        // Extract label texts to calculate semantic score
        const inputLabels = await frame.evaluate(() => {
          return Array.from(document.querySelectorAll('input, select, textarea')).map(input => {
              let label = input.getAttribute('aria-label') || input.getAttribute('placeholder') || '';
              if (input.id) {
                  const l = document.querySelector(`label[for="${input.id}"]`);
                  if (l) label = l.innerText + ' ' + label;
              }
              const wrapper = input.closest('label');
              if (wrapper) label = wrapper.innerText + ' ' + label;
              return label.toLowerCase();
          });
        });
        
        let score = 0;
        const terms = ['first name', 'last name', 'email', 'phone', 'resume', 'cover letter', 'submit application'];
        let foundTerms = [];
        
        for (const text of inputLabels) {
            for (const term of terms) {
                if (text.includes(term) && !foundTerms.includes(term)) {
                    score++;
                    foundTerms.push(term);
                }
            }
        }
        
        // Bonus for having file inputs (Resume/Cover Letter usually don't have good aria labels in generic ATS)
        if (fileInputsCount > 0 && !foundTerms.includes('resume')) {
            score++;
            foundTerms.push('resume (inferred from file input)');
        }
        
        logger.info(`Frame Score: ${score}/${terms.length + 1} (${foundTerms.join(', ')})`);
        
        if (score > bestScore) {
            bestScore = score;
            bestFrame = frame;
        }
      } catch (e) {
         logger.warn(`Error inspecting frame: ${e.message}`);
      }
    }
    
    if (bestFrame && bestScore >= 3) {
      logger.info(`Elected Frame: ${bestFrame.name() || 'unnamed'} with score ${bestScore}`);
      this.formContext = bestFrame;
    } else {
      logger.error('Failed to find a frame with an acceptable application form score. Capturing diagnostics...');
      
      const fs = require('fs');
      const currentUrl = this.page.url();
      const pageTitle = await this.page.title();
      logger.error(`Failed on URL: ${currentUrl} | Title: ${pageTitle}`);
      
      // Dump HTML
      const html = await this.page.content();
      fs.writeFileSync('greenhouse_failure_main.html', html);
      
      let i = 0;
      for (const frame of frames) {
          try {
              fs.writeFileSync(`greenhouse_failure_frame_${i}.html`, await frame.content());
          } catch(e) {}
          i++;
      }
      
      if (this.screenshotManager) {
        await this.screenshotManager.capture('DetectionFailed', true);
      }
      
      throw new Error('Application form not found on page (Score threshold not met).');
    }
    
    logger.info('Greenhouse application form detected successfully.');

    // Build the semantic map of the DOM using the correct context
    this.semanticMap = await this.formIntelligence.analyzeForm(this.formContext);
  }

  async uploadResume(resumePath) {
    if (!resumePath) return;
    logger.info(`Uploading resume: ${resumePath}`);
    
    const resumeField = this.semanticMap['RESUME_UPLOAD'];
    let inputLocator;
    
    if (resumeField && resumeField.id) {
       inputLocator = this.formContext.locator(`#${resumeField.id}`);
    } else {
       logger.warn('FormIntelligence missed resume upload; using semantic fallback strategy.');
       inputLocator = this.formContext.locator('input[type="file"][data-source="resume"], input[type="file"][aria-label*="resume" i]');
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
       inputLocator = this.formContext.locator(`#${clField.id}`);
    } else {
       inputLocator = this.formContext.locator('input[type="file"][data-source="cover_letter"], input[type="file"][aria-label*="cover letter" i]');
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
                await this.formContext.fill(`#${field.id}`, value);
             } else if (field.name) {
                await this.formContext.fill(`[name="${field.name}"]`, value);
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
    
    // Look for the submit button semantically
    const submitBtn = this.formContext.locator('#submit_app, button[type="submit"], input[type="submit"]').first();
    
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      logger.info('Clicked submit button.');
      // Wait for network idle after submission
      await this.page.waitForLoadState('networkidle').catch(() => {});
    } else {
      logger.warn('Submit button not found! Application may not have been submitted.');
    }
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
