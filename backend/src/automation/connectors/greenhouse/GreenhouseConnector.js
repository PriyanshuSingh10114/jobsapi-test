const BaseApplicationConnector = require('../interfaces/BaseApplicationConnector');
const logger = require('../../../config/logger');
const FormIntelligence = require('../../engine/FormIntelligence');
const LocatorEngine = require('../../engine/LocatorEngine');
const ScreenshotManager = require('../../managers/ScreenshotManager');
const UploadManager = require('../../managers/UploadManager');
const AIAnswerEngine = require('../../engine/AIAnswerEngine');
const CandidateResolutionEngine = require('../../engine/CandidateResolutionEngine');
const ResumeSelector = require('../../engine/ResumeSelector');
const ProfileImprovementEngine = require('../../telemetry/ProfileImprovementEngine');
const LearningRecord = require('../../../models/LearningRecord');

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
      
      const fs = require('fs').promises;
      const currentUrl = this.page.url();
      const pageTitle = await this.page.title();
      logger.error(`Failed on URL: ${currentUrl} | Title: ${pageTitle}`);
      
      // Dump HTML
      const html = await this.page.content();
      await fs.writeFile('greenhouse_failure_main.html', html).catch(() => {});
      
      let i = 0;
      for (const frame of frames) {
          try {
              await fs.writeFile(`greenhouse_failure_frame_${i}.html`, await frame.content()).catch(() => {});
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

  async uploadResume(profileData) {
    const resumeField = this.semanticMap['RESUME_UPLOAD'];
    const resumePath = profileData.documents?.defaultResume;

    if (!resumePath) {
      logger.warn('Skipped RESUME_UPLOAD\nReason: Profile value missing');
      this.pendingFields.push({ label: resumeField ? resumeField.labelText : 'Resume', reason: 'Profile has no resume' });
      return;
    }
    logger.info(`Uploading resume: ${resumePath}`);
    
    let inputLocator;
    if (resumeField && resumeField.id) {
       inputLocator = this.formContext.locator(`#${resumeField.id}`);
    } else {
       logger.warn('FormIntelligence missed resume upload; using semantic fallback strategy.');
       inputLocator = this.formContext.locator('input[type="file"][data-source="resume"], input[type="file"][aria-label*="resume" i]');
    }
    
    if (await inputLocator.count() > 0) {
        try {
          const firstInput = inputLocator.first();
          // Force visibility in case it is occluded or display:none
          await firstInput.evaluate(el => {
              el.style.display = 'block';
              el.style.visibility = 'visible';
              el.style.opacity = '1';
              el.style.position = 'static';
          }).catch(() => {});

          await this.uploadManager.uploadFile(firstInput, resumePath);
          
          // Verify the upload by checking if the filename appears in the DOM or input property
          const filename = resumePath.split(/[/\\]/).pop();
          try {
            await Promise.any([
                this.formContext.waitForSelector(`text="${filename}"`, { timeout: 3000 }),
                firstInput.evaluate((el, name) => el.files && el.files.length > 0 && el.files[0].name === name, filename).then(res => { if(!res) throw new Error('Not found'); })
            ]);
            this.completedFields.push('RESUME_UPLOAD');
          } catch (verifyErr) {
           logger.warn(`Uploaded resume but could not verify filename "${filename}" in DOM.`);
           // Still mark as completed as some ATS hide the filename
           this.completedFields.push('RESUME_UPLOAD');
         }
       } catch (err) {
         logger.warn(`Failed to upload resume: ${err.message}`);
         this.pendingFields.push({ label: 'Resume', reason: `Upload failed: ${err.message}` });
       }
    } else {
       logger.warn('Resume file input completely missing from DOM.');
       this.pendingFields.push({ label: 'Resume', reason: 'Resume file input missing from DOM' });
    }
  }

  async uploadCoverLetter(profileData) {
    const clField = this.semanticMap['COVER_LETTER_UPLOAD'];
    const coverLetters = profileData.documents?.coverLetters || [];
    const coverLetterPath = coverLetters.length > 0 ? coverLetters[0].storagePath : null;

    if (!coverLetterPath) {
      logger.warn('Skipped COVER_LETTER_UPLOAD\nReason: Profile value missing');
      this.pendingFields.push({ label: clField ? clField.labelText : 'Cover Letter', reason: 'Profile has no cover letter' });
      return;
    }
    logger.info(`Uploading cover letter: ${coverLetterPath}`);
    
    let inputLocator;
    if (clField && clField.id) {
       inputLocator = this.formContext.locator(`#${clField.id}`);
    } else {
       inputLocator = this.formContext.locator('input[type="file"][data-source="cover_letter"], input[type="file"][aria-label*="cover letter" i]');
    }
    
    if (await inputLocator.count() > 0) {
        try {
          const firstInput = inputLocator.first();
          // Force visibility
          await firstInput.evaluate(el => {
              el.style.display = 'block';
              el.style.visibility = 'visible';
              el.style.opacity = '1';
          }).catch(() => {});

          await this.uploadManager.uploadFile(firstInput, coverLetterPath);
          
          const filename = coverLetterPath.split(/[/\\]/).pop();
          try {
            await Promise.any([
                this.formContext.waitForSelector(`text="${filename}"`, { timeout: 3000 }),
                firstInput.evaluate((el, name) => el.files && el.files.length > 0 && el.files[0].name === name, filename).then(res => { if(!res) throw new Error('Not found'); })
            ]);
          } catch (e) {}

          this.completedFields.push('COVER_LETTER_UPLOAD');
        } catch (err) {
         logger.warn(`Failed to upload cover letter: ${err.message}`);
         this.pendingFields.push({ label: 'Cover Letter', reason: `Upload failed: ${err.message}` });
       }
    }
  }

  async resolveFields(profileData) {
    logger.info('Resolving fields against profile data...');
    const answerEngine = new AIAnswerEngine(profileData);
    const resolutionEngine = new CandidateResolutionEngine(profileData, answerEngine);
    const CONFIDENCE_THRESHOLD = 0.85;

    this.resolvedFieldsToFill = [];

    if (!this.formIntelligence || !this.formIntelligence.allFields) {
       logger.warn('Form fields not available for iteration.');
       return;
    }

    for (const field of this.formIntelligence.allFields) {
       try {
           const semanticEntry = Object.entries(this.semanticMap).find(([k, v]) => v.index === field.index);
           const semanticKey = semanticEntry ? semanticEntry[0] : null;
           const confidence = semanticEntry ? semanticEntry[1].confidence : 0;

           if (semanticKey === 'RESUME_UPLOAD' || semanticKey === 'COVER_LETTER_UPLOAD') continue;
           
           if (semanticKey === 'UNKNOWN_FIELD') {
              try {
                  await LearningRecord.findOneAndUpdate(
                      { connectorName: 'greenhouse', fieldLabel: field.labelText },
                      { 
                          $setOnInsert: { fieldName: field.name, fieldType: field.type, parentSection: field.parentSection },
                          $inc: { occurrences: 1 } 
                      },
                      { upsert: true }
                  );
              } catch(err) {}
              this.pendingFields.push({ label: field.labelText || field.name, reason: 'Unknown field type - Added to Learning Engine' });
              continue;
           }

           if (!semanticKey || confidence < CONFIDENCE_THRESHOLD) {
              this.pendingFields.push({ label: field.labelText || field.name || 'Unknown', reason: `Low confidence mapping (${Math.round(confidence * 100)}%)` });
              continue;
           }

           const value = await resolutionEngine.resolveValue(semanticKey, field);

           let selector = '';
           if (field.id) selector = `#${field.id}`;
           else if (field.name) selector = `[name="${field.name}"]`;

           if (!value) {
              logger.warn(`Skipped ${semanticKey || field.labelText || field.name}\nReason: Profile value missing`);
              this.pendingFields.push({
                 label: field.labelText || field.name || 'Unknown Field',
                 reason: 'Missing profile value'
              });
              
              if (selector) {
                 try {
                   await this.formContext.locator(selector).evaluate(el => {
                      el.style.border = '2px solid red';
                      el.style.backgroundColor = '#ffeeee';
                   });
                 } catch(e) {}
              }
              continue;
           }
           
           this.resolvedFieldsToFill.push({ field, semanticKey, value, selector, confidence });
       } catch (err) {
           this.pendingFields.push({ label: field.labelText || 'Unknown', reason: `Resolution error: ${err.message}` });
       }
    }
    
    this.resolutionReport = resolutionEngine.getResolutionReport();
    logger.info(`Resolution complete. Detected: ${this.resolutionReport.detectedFields}, Resolved: ${this.resolutionReport.resolvedCount}, Skipped: ${this.resolutionReport.skippedCount}`);
  }

  async generateAIAnswers(profileData) {
    logger.info('Generating AI answers for contextual fields...');
    // Future LLM-driven generation
  }

  async fillFields(profileData) {
     logger.info('Filling resolved fields into DOM...');
     if (!this.resolvedFieldsToFill) return;

     for (const item of this.resolvedFieldsToFill) {
         const { field, semanticKey, value, selector, confidence } = item;
         if (selector) {
             try {
                 const locator = this.formContext.locator(selector);
                 if (field.tagName === 'select' || field.role === 'combobox') {
                     const options = await locator.locator('option').allInnerTexts();
                     const match = options.find(opt => opt.toLowerCase().includes(value.toLowerCase()));
                     if (match) await locator.selectOption({ label: match });
                     else await locator.fill(value);
                 } else if (field.type === 'checkbox' || field.type === 'radio') {
                     await locator.check();
                 } else {
                     await locator.fill(value);
                 }
                 
                 logger.info(`Filled ${semanticKey} (Confidence: ${confidence})`);
                 this.completedFields.push(semanticKey);
             } catch (err) {
                 logger.warn(`Failed to fill ${semanticKey}: ${err.message}`);
                 this.pendingFields.push({ label: field.labelText || semanticKey, reason: `Fill failed: ${err.message}` });
             }
         }
     }

     const telemetry = new ProfileImprovementEngine(profileData);
     telemetry.analyzeSkippedFields(this.pendingFields);
  }

  async validateFilledFields() {
     logger.info('Validating filled fields...');
     if (!this.resolvedFieldsToFill) return;

     for (const item of this.resolvedFieldsToFill) {
         const { field, semanticKey, value, selector } = item;
         if (selector) {
             try {
                 const locator = this.formContext.locator(selector);
                 if (field.type === 'checkbox' || field.type === 'radio') {
                     const isChecked = await locator.isChecked();
                     if (!isChecked) {
                         logger.warn(`Validation Warning: Field ${semanticKey} is not checked as expected.`);
                     }
                 } else if (field.tagName === 'select' || field.role === 'combobox') {
                     // Check selected option text or inputValue
                     const selectedValue = await locator.inputValue();
                     if (!selectedValue) {
                         logger.warn(`Validation Warning: Field ${semanticKey} dropdown has no selected value.`);
                     }
                 } else {
                     const filledValue = await locator.inputValue();
                     if (filledValue !== value) {
                         logger.warn(`Validation Warning: Field ${semanticKey} filled value mismatch. Expected ${value}, got ${filledValue}`);
                     }
                 }
             } catch (err) {
                 logger.warn(`Validation error for ${semanticKey}: ${err.message}`);
             }
         }
     }
  }



  async review() {
    logger.info('Reviewing application (Greenhouse is typically single page)...');
  }

  async submit() {
    logger.info('Submitting application...');
    
    // Look for the submit button semantically
    const submitBtn = this.formContext.locator('#submit_app, button[type="submit"], input[type="submit"]').first();
    
    if (await submitBtn.count() > 0) {
      logger.info('Clicked submit button.');
      // Prevent race conditions by running click and navigation await in parallel
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
        submitBtn.click()
      ]);
    } else {
      logger.warn('Submit button not found! Application may not have been submitted.');
    }
  }

  async verify() {
    logger.info('Verifying submission...');
    // Verify successful submission by checking for confirmation texts or URL changes
    const successRegex = /(thank you|application submitted|success|received your application)/i;
    
    try {
        await this.page.waitForSelector(`text=/${successRegex.source}/i`, { timeout: 8000 });
        logger.info('Verified submission via text matching.');
    } catch (e) {
        logger.warn('Could not verify submission via text. Checking URL or form presence.');
        const formStillExists = await this.formContext.locator('form').count();
        if (formStillExists > 0) {
            throw new Error('Form still exists on page. Submission likely failed or validation errors are present.');
        }
    }
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
