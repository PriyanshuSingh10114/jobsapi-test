const logger = require('../../config/logger');

class UploadManager {
  constructor(page) {
    this.page = page;
  }

  async uploadFile(locator, filePath) {
    try {
      logger.info(`Uploading file to locator: ${filePath}`);
      if (!filePath) {
        throw new Error('File path is required for upload');
      }

      await locator.setInputFiles(filePath);
      logger.info('File uploaded successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to upload file: ${error.message}`);
      return false;
    }
  }

  async handleDialogUpload(triggerLocator, filePath) {
      // In some ATS, clicking a button opens an OS dialog.
      // Playwright can intercept this.
      const [fileChooser] = await Promise.all([
        this.page.waitForEvent('filechooser'),
        triggerLocator.click()
      ]);
      await fileChooser.setFiles(filePath);
      logger.info('File uploaded via filechooser event.');
  }
}

module.exports = UploadManager;
