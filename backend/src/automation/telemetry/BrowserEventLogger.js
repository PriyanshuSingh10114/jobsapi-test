const AutomationLog = require('../../models/AutomationLog');

class BrowserEventLogger {
  constructor(sessionId) {
    this.sessionId = sessionId;
  }

  async logEvent(level, event, message, metadata = {}) {
    try {
      await AutomationLog.create({
        applicationSessionId: this.sessionId,
        level,
        event,
        message,
        metadata
      });
    } catch (err) {
      console.error(`Failed to log browser event: ${err.message}`);
    }
  }

  async info(event, message, metadata) {
    return this.logEvent('INFO', event, message, metadata);
  }

  async warn(event, message, metadata) {
    return this.logEvent('WARN', event, message, metadata);
  }

  async error(event, message, metadata) {
    return this.logEvent('ERROR', event, message, metadata);
  }

  async debug(event, message, metadata) {
    return this.logEvent('DEBUG', event, message, metadata);
  }
}

module.exports = BrowserEventLogger;
