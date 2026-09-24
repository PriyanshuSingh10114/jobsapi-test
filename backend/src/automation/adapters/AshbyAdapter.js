const ATSAdapter = require('./ATSAdapter');
const logger = require('../../config/logger');

class AshbyAdapter extends ATSAdapter {
  constructor(page, options = {}) {
    super(page, options);
    this.atsName = 'ashby';
  }

  async detect(page) {
    const url = page.url();
    if (/jobs\.ashbyhq\.com|ashbyhq\.com/i.test(url)) return true;
    const isAshby = await page.evaluate(() => {
      return !!document.querySelector('[data-ashby-application-form], .ashby-application-form');
    }).catch(() => false);
    return isAshby;
  }

  async submit(page) {
    logger.info('AshbyAdapter: Submitting application');
    const submitBtn = page.locator('button[type="submit"], button:has-text("Submit Application")').first();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    return {
      success: true,
      confirmationText: 'Ashby application successfully submitted'
    };
  }
}

module.exports = AshbyAdapter;
