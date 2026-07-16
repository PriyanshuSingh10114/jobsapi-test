const BrowserMetrics = require('../../models/BrowserMetrics');
const logger = require('../../config/logger');

class TelemetryManager {
  constructor(sessionId, connectorName) {
    this.sessionId = sessionId;
    this.connectorName = connectorName;
    this.startTime = Date.now();
    this.pageLoadStartTime = 0;
    this.metrics = {
      pageLoadDurationMs: 0,
      retryCount: 0,
      selectorFailures: 0,
    };
  }

  startPageLoad() {
    this.pageLoadStartTime = Date.now();
  }

  endPageLoad() {
    if (this.pageLoadStartTime > 0) {
      this.metrics.pageLoadDurationMs += (Date.now() - this.pageLoadStartTime);
      this.pageLoadStartTime = 0;
    }
  }

  recordRetry() {
    this.metrics.retryCount += 1;
  }

  recordSelectorFailure() {
    this.metrics.selectorFailures += 1;
  }

  async finalize(isSuccess) {
    const totalDurationMs = Date.now() - this.startTime;
    try {
      await BrowserMetrics.create({
        applicationSessionId: this.sessionId,
        connectorName: this.connectorName,
        pageLoadDurationMs: this.metrics.pageLoadDurationMs,
        totalDurationMs,
        retryCount: this.metrics.retryCount,
        selectorFailures: this.metrics.selectorFailures,
        isSuccess
      });
      logger.info(`Telemetry recorded for session ${this.sessionId}. Success: ${isSuccess}. Total time: ${totalDurationMs}ms`);
    } catch (error) {
      logger.error(`Failed to save telemetry: ${error.message}`);
    }
  }
}

module.exports = TelemetryManager;
