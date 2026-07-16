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
    // Defines valid transitions, simplified for now
    const validStates = [
      'Pending', 'ApplicationCreated', 'BrowserStarted', 'JobOpened',
      'ResumeUploaded', 'QuestionsAnswered', 'ReadyForSubmission', 
      'Submitted', 'Verified', 'Completed', 'Failed', 'Cancelled'
    ];
    return validStates.includes(newState);
  }

  async incrementRetry() {
    if (!this.session) await this.load();
    this.session.retryCount += 1;
    await this.session.save();
    return this.session.retryCount <= this.session.maxRetries;
  }
}

module.exports = ApplicationStateMachine;
