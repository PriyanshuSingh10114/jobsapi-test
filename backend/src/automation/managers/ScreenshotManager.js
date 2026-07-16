const fs = require('fs');
const path = require('path');
const logger = require('../../config/logger');
const ApplicationEvidence = require('../../models/ApplicationEvidence');

class ScreenshotManager {
  constructor(page, applicationSessionId, browserSessionId) {
    this.page = page;
    this.applicationSessionId = applicationSessionId;
    this.browserSessionId = browserSessionId;
    const dirId = applicationSessionId ? applicationSessionId.toString() : (browserSessionId || 'anon');
    this.evidenceDir = path.join(process.cwd(), 'evidence', dirId);
    
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
      if (this.applicationSessionId) {
        await ApplicationEvidence.create({
          applicationSessionId: this.applicationSessionId,
          browserSessionId: this.browserSessionId,
          type: 'Screenshot',
          checkpoint,
          filePath
        });
      }

      return filePath;
    } catch (error) {
      logger.error(`Failed to capture screenshot: ${error.message}`);
      return null;
    }
  }
}

module.exports = ScreenshotManager;
