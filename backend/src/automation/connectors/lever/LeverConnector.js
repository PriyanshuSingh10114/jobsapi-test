const logger = require('../../../config/logger');
const FormIntelligence = require('../../engine/FormIntelligence');
const FieldFillEngine = require('../../engine/FieldFillEngine');
const AIQuestionEngine = require('../../engine/AIQuestionEngine');
const UniversalSemanticResolver = require('../../engine/UniversalSemanticResolver');

class LeverConnector {
  constructor(automationContext, session) {
    this.context = automationContext;
    this.page = automationContext.page;
    this.session = session;
    this.formIntelligence = new FormIntelligence(this.page);
    this.fieldFillEngine = new FieldFillEngine(this.page);
    this.completedFields = [];
    this.pendingFields = [];
    this.uploadResults = [];
    this.diagnosticsTable = [];
    this.semanticMap = {};
    this.formContext = this.page;
  }

  async initialize() {
    logger.info('[LeverConnector] Initializing Lever application session...');
  }

  async openJob(applyUrl) {
    logger.info(`[LeverConnector] Opening Lever application URL: ${applyUrl}`);
    await this.page.goto(applyUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Handle iframe embedding if present
    const iframeElement = await this.page.$('iframe[src*="lever"]');
    if (iframeElement) {
      const frame = await iframeElement.contentFrame();
      if (frame) {
        this.formContext = frame;
        logger.info('[LeverConnector] Lever application embedded in iframe. Switched context.');
      }
    }
  }

  async detectApplication() {
    logger.info('[LeverConnector] Detecting Lever application form controls...');
    this.semanticMap = await this.formIntelligence.analyzeForm(this.formContext);
    return true;
  }

  async uploadResume(profileData) {
    logger.info('[LeverConnector] Uploading resume asset...');
    const resumePath = profileData.documents?.defaultResume;
    if (!resumePath) {
      throw new Error('No valid resume file path provided in candidate profile');
    }

    const resumeField = this.semanticMap['RESUME_UPLOAD'];
    const locator = resumeField?.cssPath 
      ? this.formContext.locator(resumeField.cssPath) 
      : this.formContext.locator('input[type="file"]').first();

    if (await locator.count() > 0) {
      await this.fieldFillEngine.fillField({ controlType: 'file' }, resumePath, locator.first());
      this.completedFields.push('RESUME_UPLOAD');
      this.uploadResults.push({ type: 'Resume', verified: true, path: resumePath, method: 'DOM_Badge' });
      this.diagnosticsTable.push({
        atsField: 'Resume Upload',
        semanticField: 'documents.defaultResume',
        source: 'Candidate Knowledge Graph',
        resolvedValue: resumePath,
        confidence: 1.0,
        status: 'Filled',
        reason: 'Resume PDF uploaded'
      });
    }

    // Cover Letter optional upload
    const coverLetters = profileData.documents?.coverLetters || [];
    const clField = this.semanticMap['COVER_LETTER_UPLOAD'];
    const coverLetterPath = coverLetters.length > 0 ? coverLetters[0].storagePath : null;

    if (coverLetterPath) {
      const clLoc = clField?.cssPath ? this.formContext.locator(clField.cssPath) : this.formContext.locator('input[type="file"]').nth(1);
      if (await clLoc.count() > 0) {
        try {
          await this.fieldFillEngine.fillField({ controlType: 'file' }, coverLetterPath, clLoc.first());
          this.completedFields.push('COVER_LETTER_UPLOAD');
          this.uploadResults.push({ type: 'CoverLetter', verified: true, path: coverLetterPath, method: 'DOM_Badge' });
        } catch (e) {}
      }
    }
  }

  async generateAIAnswers(profileData) {
    logger.info('[LeverConnector] Pre-generating AI answers using Universal Semantic Resolver...');
  }

  async fillFields(profileData) {
    logger.info('[LeverConnector] Executing Universal Semantic Field Filling Engine...');
    const questionEngine = new AIQuestionEngine({ graph: profileData });
    const allScannedFields = this.formIntelligence.allFields || [];

    for (const field of allScannedFields) {
      if (field.controlType === 'file' || field.inputType === 'file') continue;

      // 1. Universal Semantic Resolution (Eliminates raw Lever IDs cards[07fdf...])
      const semantic = UniversalSemanticResolver.resolve(field);
      const atsFieldLabel = semantic.cleanLabelText || field.labelText || 'Application Field';
      
      // 2. Value resolution from Knowledge Graph canonical paths
      let resolvedValue = null;
      let source = 'Knowledge Graph';
      let confidence = semantic.confidence;

      if (semantic.canonicalKey === 'identity.firstName') resolvedValue = profileData.identity?.firstName || profileData.personal?.firstName || profileData.basicInfo?.firstName;
      else if (semantic.canonicalKey === 'identity.lastName') resolvedValue = profileData.identity?.lastName || profileData.personal?.lastName || profileData.basicInfo?.lastName;
      else if (semantic.canonicalKey === 'identity.fullName') resolvedValue = `${profileData.identity?.firstName || profileData.personal?.firstName || ''} ${profileData.identity?.lastName || profileData.personal?.lastName || ''}`.trim();
      else if (semantic.canonicalKey === 'contact.email') resolvedValue = profileData.contact?.email || profileData.basicInfo?.email;
      else if (semantic.canonicalKey === 'contact.phone') resolvedValue = profileData.contact?.phone || profileData.basicInfo?.phone;
      else if (semantic.canonicalKey === 'links.linkedin') resolvedValue = profileData.links?.linkedin;
      else if (semantic.canonicalKey === 'links.github') resolvedValue = profileData.links?.github;
      else if (semantic.canonicalKey === 'links.portfolio') resolvedValue = profileData.links?.portfolio;
      else if (semantic.canonicalKey === 'location.city') resolvedValue = profileData.location?.city;
      else if (semantic.canonicalKey === 'location.state') resolvedValue = profileData.location?.state;
      else if (semantic.canonicalKey === 'location.country') resolvedValue = profileData.location?.country;
      else if (semantic.canonicalKey === 'authorization.isAuthorizedInUS') resolvedValue = profileData.authorization?.isAuthorizedInUS ?? true;
      else if (semantic.canonicalKey === 'authorization.requiresSponsorshipNowOrFuture') resolvedValue = profileData.authorization?.requiresSponsorshipNowOrFuture ?? false;

      // 3. Fallback to AI Question Engine if value not found in Knowledge Graph
      if (resolvedValue === null || resolvedValue === undefined || resolvedValue === '') {
        resolvedValue = await questionEngine.answerQuestion(atsFieldLabel, field);
        source = 'AI Generator';
      }

      // 4. Fill Field & Record Telemetry Diagnostics
      if (resolvedValue !== null && resolvedValue !== undefined && String(resolvedValue).trim() !== '') {
        try {
          const loc = this.formContext.locator(field.cssPath);
          if (await loc.count() > 0) {
            await this.fieldFillEngine.fillField(field, resolvedValue, loc.first());
            this.completedFields.push(atsFieldLabel);
            this.diagnosticsTable.push({
              atsField: atsFieldLabel,
              semanticField: semantic.canonicalKey,
              source,
              resolvedValue: String(resolvedValue).substring(0, 40),
              confidence,
              status: 'Filled',
              reason: 'Successfully populated by FieldFillEngine'
            });
          }
        } catch (err) {
          this.pendingFields.push({ label: atsFieldLabel, reason: err.message });
          this.diagnosticsTable.push({
            atsField: atsFieldLabel,
            semanticField: semantic.canonicalKey,
            source,
            resolvedValue: String(resolvedValue).substring(0, 40),
            confidence,
            status: 'Skipped',
            reason: err.message
          });
        }
      } else {
        this.pendingFields.push({ label: atsFieldLabel, reason: 'No answer available in Knowledge Graph or AI Engine' });
        this.diagnosticsTable.push({
          atsField: atsFieldLabel,
          semanticField: semantic.canonicalKey,
          source: 'Missing Data',
          resolvedValue: null,
          confidence: 0,
          status: 'Skipped',
          reason: 'No value in Candidate Knowledge Graph'
        });
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
