const ApplicationSession = require('../../models/ApplicationSession');
const logger = require('../../config/logger');

class ApplicationStateMachine {
  constructor(applicationSessionId) {
    this.sessionId = applicationSessionId;
    this.session = null;
  }

  async load() {
    this.session = await ApplicationSession.findById(this.sessionId);
    if (!this.session) {
      throw new Error(`ApplicationSession not found: ${this.sessionId}`);
    }
    return this.session;
  }

  async updateState(newState, data = null, error = null) {
    if (!this.session) await this.load();
    
    if (!this.canTransitionTo(newState)) {
      throw new Error(`Invalid state transition from ${this.session.status} to ${newState}`);
    }

    logger.info(`State Transition [${this.sessionId}]: ${this.session.status} -> ${newState}`);
    
    this.session.status = newState;
    this.session.lastUpdatedAt = new Date();
    
    if (data) {
      this.session.stateData = { ...this.session.stateData, ...data };
    }
    
    if (error) {
      this.session.error = error.message || String(error);
    }

    if (['Completed', 'Failed', 'Cancelled'].includes(newState)) {
      this.session.completedAt = new Date();
    }

    await this.session.save();
  }

  canTransitionTo(newState) {
    const validTransitions = {
      'Pending': ['BrowserStarted', 'Failed', 'Cancelled'],
      'BrowserStarted': ['JobOpened', 'Failed', 'Cancelled'],
      'JobOpened': ['AnalyzingForm', 'Failed', 'Cancelled'],
      'AnalyzingForm': ['FillingProfile', 'Failed', 'Cancelled'],
      'FillingProfile': ['UploadingResume', 'Failed', 'Cancelled'],
      'UploadingResume': ['AnsweringQuestions', 'Failed', 'Cancelled'],
      'AnsweringQuestions': ['PendingUserInput', 'ReadyForSubmission', 'Failed', 'Cancelled'],
      'PendingUserInput': ['ReadyForSubmission', 'Failed', 'Cancelled'],
      'ReadyForSubmission': ['Submitting', 'Failed', 'Cancelled'],
      'Submitting': ['Submitted', 'Failed', 'Cancelled'],
      'Submitted': ['Verified', 'Failed', 'Cancelled'],
      'Verified': ['Completed', 'CompletedWithWarnings', 'Failed', 'Cancelled'],
      'Completed': [],
      'CompletedWithWarnings': [],
      'Failed': ['Pending', 'Cancelled'], // Retry goes back to Pending
      'Cancelled': []
    };

    // If session is null (initial state creation), allow Pending
    if (!this.session) return newState === 'Pending';

    const currentState = this.session.status || 'Pending';
    const allowed = validTransitions[currentState] || [];
    
    return allowed.includes(newState);
  }

  async incrementRetry() {
    if (!this.session) await this.load();
    this.session.retryCount += 1;
    await this.session.save();
    return this.session.retryCount <= this.session.maxRetries;
  }
}

module.exports = ApplicationStateMachine;
