const ATSAdapter = require('./ATSAdapter');
const logger = require('../../config/logger');

class GenericATSAdapter extends ATSAdapter {
  constructor(page, options = {}) {
    super(page, options);
    this.atsName = 'generic';
  }

  async detect(page) {
    // Generic fallback matches any webpage with interactive forms
    const hasForms = await page.evaluate(() => {
      return document.querySelectorAll('input, select, textarea').length > 0;
    }).catch(() => false);
    return hasForms;
  }

  async submit(page) {
    logger.info('GenericATSAdapter: Submitting application');
    const submitBtn = page.locator('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply")').first();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    return {
      success: true,
      confirmationText: 'Generic application form submitted'
    };
  }
}

module.exports = GenericATSAdapter;
