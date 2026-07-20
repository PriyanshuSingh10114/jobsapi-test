class BaseApplicationConnector {
  constructor(context, page, sessionData, applicationSessionId) {
    this.context = context;
    this.page = page;
    this.sessionData = sessionData;
    this.applicationSessionId = applicationSessionId;
    this.completedFields = [];
    this.pendingFields = [];
  }

  /**
   * Initializes the connector. Override to perform custom setup.
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Performs authentication if needed.
   */
  async authenticate() {
    throw new Error('authenticate() must be implemented by subclass');
  }

  /**
   * Navigates to the specific job application page.
   */
  async openJob(jobUrl) {
    throw new Error('openJob() must be implemented by subclass');
  }

  /**
   * Detects if the current page is an application page.
   */
  async detectApplication() {
    throw new Error('detectApplication() must be implemented by subclass');
  }

  /**
   * Uploads the resume file.
   */
  async uploadResume(resumePath) {
    throw new Error('uploadResume() must be implemented by subclass');
  }

  /**
   * Uploads the cover letter file.
   */
  async uploadCoverLetter(coverLetterPath) {
    throw new Error('uploadCoverLetter() must be implemented by subclass');
  }

  /**
   * Fills in profile data (name, email, phone, etc).
   */
  async fillProfile(profileData) {
    throw new Error('fillProfile() must be implemented by subclass');
  }

  /**
   * Answers custom questions using AI profile.
   */
  async answerQuestions(profileData) {
    throw new Error('answerQuestions() must be implemented by subclass');
  }

  /**
   * Reviews the application before submission.
   */
  async review() {
    throw new Error('review() must be implemented by subclass');
  }

  /**
   * Clicks the final submit button.
   */
  async submit() {
    throw new Error('submit() must be implemented by subclass');
  }

  /**
   * Verifies the submission was successful.
   */
  async verify() {
    throw new Error('verify() must be implemented by subclass');
  }

  /**
   * Captures evidence of the application state.
   */
  async captureEvidence(type, checkpoint) {
    throw new Error('captureEvidence() must be implemented by subclass');
  }

  /**
   * Cleans up resources.
   */
  async cleanup() {
    if (this.page) {
      await this.page.close().catch(() => {});
    }
  }
}

module.exports = BaseApplicationConnector;
