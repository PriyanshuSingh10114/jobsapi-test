/**
 * Production Custom Error Classes
 * File: backend/src/automation/errors/CustomErrors.js
 */

class AutomationBaseError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.jobId = details.jobId || null;
    this.sessionId = details.sessionId || null;
    this.browserId = details.browserId || null;
    this.connector = details.connector || null;
    this.state = details.state || null;
    this.recoveryAction = details.recoveryAction || 'Retry';
  }
}

class BrowserUnavailableError extends AutomationBaseError {
  constructor(message, details) {
    super(message || 'No browsers available in pool and request queue timed out', {
      ...details,
      recoveryAction: 'QueueJob'
    });
  }
}

class ProfileIncompleteError extends AutomationBaseError {
  constructor(message, details) {
    super(message || 'Candidate profile is missing critical required fields', {
      ...details,
      recoveryAction: 'WaitingForUser'
    });
  }
}

class SemanticResolutionError extends AutomationBaseError {
  constructor(message, details) {
    super(message || 'Failed to map DOM element to canonical semantic field', {
      ...details,
      recoveryAction: 'AIAnswerFallback'
    });
  }
}

class ResumeUploadError extends AutomationBaseError {
  constructor(message, details) {
    super(message || 'Failed to upload or verify candidate resume file', {
      ...details,
      recoveryAction: 'ReattemptUpload'
    });
  }
}

class ATSNavigationError extends AutomationBaseError {
  constructor(message, details) {
    super(message || 'Failed to navigate or detect target ATS job page', {
      ...details,
      recoveryAction: 'Retry'
    });
  }
}

class AIGenerationError extends AutomationBaseError {
  constructor(message, details) {
    super(message || 'AI Question Engine failed to generate response', {
      ...details,
      recoveryAction: 'DefaultAnswer'
    });
  }
}

class FieldResolutionError extends AutomationBaseError {
  constructor(message, details) {
    super(message || 'Field fill engine failed to populate form control', {
      ...details,
      recoveryAction: 'SkipField'
    });
  }
}

module.exports = {
  AutomationBaseError,
  BrowserUnavailableError,
  ProfileIncompleteError,
  SemanticResolutionError,
  ResumeUploadError,
  ATSNavigationError,
  AIGenerationError,
  FieldResolutionError
};
