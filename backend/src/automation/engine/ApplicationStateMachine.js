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
      const allowed = this.getAllowedTransitions(this.session.status);
      throw new Error(`Invalid state transition. Current: [${this.session.status}]. Target: [${newState}]. Allowed: [${allowed.join(', ')}]`);
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

  get workflowOrder() {
    return [
      'Created',
      'Queued',
      'WorkerAssigned',
      'LoadingProfile',
      'ValidatingProfile',
      'BrowserStarting',
      'BrowserReady',
      'OpeningJob',
      'AnalyzingPage',
      'AnalyzingForm',
      'ResolvingFields',
      'UploadingResume',
      'GeneratingAIAnswers',
      'FillingFields',
      'ValidatingFilledFields',
      'WaitingForUser',
      'ReadyForSubmission',
      'Submitting',
      'SubmissionVerification',
      'Completed'
    ];
  }

  getAllowedTransitions(currentState) {
    const order = this.workflowOrder;
    const currentIndex = order.indexOf(currentState);
    
    let allowed = [];
    if (currentIndex !== -1 && currentIndex < order.length - 1) {
       allowed.push(order[currentIndex + 1]);
    }
    
    // Global terminal states allowed from almost anywhere
    allowed.push('Failed', 'Cancelled');
    
    // Specific overrides
    if (currentState === 'WaitingForUser') allowed.push('ReadyForSubmission');
    if (currentState === 'SubmissionVerification') allowed.push('CompletedWithWarnings', 'Completed');
    if (currentState === 'Failed') allowed = []; // Failed is terminal (retries shouldn't transition to Failed again)
    if (currentState === 'Cancelled') allowed = [];
    if (currentState === 'Completed') allowed = [];
    if (currentState === 'CompletedWithWarnings') allowed = [];

    return allowed;
  }

  canTransitionTo(newState) {
    if (!this.session) return newState === 'Created';
    const currentState = this.session.status || 'Created';
    
    // If the worker tries to transition to Failed when it's already Failed, block it explicitly
    if (currentState === 'Failed' && newState === 'Failed') {
        return false;
    }

    // Never transition ValidatingProfile -> ValidatingProfile
    if (currentState === 'ValidatingProfile' && newState === 'ValidatingProfile') {
        return false;
    }

    const allowed = this.getAllowedTransitions(currentState);
    return allowed.includes(newState);
  }

  /**
   * Resumable workflow logic. Checks if the state machine has already passed this state.
   * If it has, the worker should skip executing the logic for this state.
   */
  shouldExecute(targetState) {
    if (!this.session) return true;
    const currentState = this.session.status || 'Created';
    
    // If we are currently Failed, we shouldn't execute anything until retry logic resets something?
    // Wait, the worker picks up the job. The state is whatever it was BEFORE it crashed, 
    // because we changed the retry logic to NOT transition to Failed for transient errors.
    
    const order = this.workflowOrder;
    const currentIndex = order.indexOf(currentState);
    const targetIndex = order.indexOf(targetState);
    
    // If target is after our current state, we definitely execute it.
    // Wait, if we are AT 'AnalyzingForm', we should execute the logic to transition to the NEXT step.
    // So if targetIndex >= currentIndex, execute it.
    if (targetIndex >= currentIndex) return true;
    
    return false;
  }

  async incrementRetry() {
    if (!this.session) await this.load();
    this.session.retryCount += 1;
    await this.session.save();
    return this.session.retryCount <= this.session.maxRetries;
  }
}

module.exports = ApplicationStateMachine;
