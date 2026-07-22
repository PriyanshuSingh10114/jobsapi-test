const logger = require('../../config/logger');

class AutomationContext {
  constructor({ sessionId, jobId, userId, browser, context, page, owner = 'WorkerProcessor' }) {
    if (!browser || !context || !page) {
      throw new Error('AutomationContext requires browser, context, and page instances.');
    }

    this.sessionId = sessionId || 'unknown_session';
    this.jobId = jobId || 'unknown_job';
    this.userId = userId || 'unknown_user';
    this.browser = browser;
    this.context = context;
    this.page = page;
    this.owner = owner;

    // Standardized IDs for telemetry & tracing
    this.browserId = browser._guid || browser.__id || `browser_${Date.now()}`;
    this.contextId = context._guid || context.__id || `context_${Date.now()}`;
    this.pageId = page._guid || page.__id || `page_${Date.now()}`;
  }

  /**
   * Log ownership state transition at any pipeline stage.
   * @param {string} stage - Current execution stage/step name
   * @param {string} [newOwner] - Current owner component (e.g. 'GreenhouseConnector', 'FieldFillEngine')
   */
  logOwnership(stage, newOwner) {
    if (newOwner) {
      this.owner = newOwner;
    }
    logger.info(`[BrowserOwnership] Browser acquired | Stage: ${stage} | Owner: ${this.owner} | Browser ID: ${this.browserId} | Context ID: ${this.contextId} | Page ID: ${this.pageId}`);
  }
}

module.exports = AutomationContext;
