const fs = require('fs');
const path = require('path');
const logger = require('../../config/logger');
const ApplicationEvidence = require('../../models/ApplicationEvidence');

class ScreenshotManager {
  constructor(page, sessionId) {
    this.page = page;
    this.sessionId = sessionId;
    this.evidenceDir = path.join(process.cwd(), 'evidence', sessionId);
    
    // Ensure directory exists
    if (!fs.existsSync(this.evidenceDir)) {
      fs.mkdirSync(this.evidenceDir, { recursive: true });
    }
  }

  async capture(checkpoint, fullPage = true) {
    try {
      logger.info(`Capturing screenshot at checkpoint: ${checkpoint}`);
      const filename = `${checkpoint}_${Date.now()}.png`;
      const filePath = path.join(this.evidenceDir, filename);

      await this.page.screenshot({ path: filePath, fullPage });

      // Save record in DB
      await ApplicationEvidence.create({
        applicationSessionId: this.sessionId,
        type: 'Screenshot',
        checkpoint,
        filePath
      });

      return filePath;
    } catch (error) {
      logger.error(`Failed to capture screenshot: ${error.message}`);
      return null;
    }
  }
}

module.exports = ScreenshotManager;
