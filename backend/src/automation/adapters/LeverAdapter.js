const ATSAdapter = require('./ATSAdapter');
const logger = require('../../config/logger');

class LeverAdapter extends ATSAdapter {
  constructor(page, options = {}) {
    super(page, options);
    this.atsName = 'lever';
  }

  async detect(page) {
    const url = page.url();
    if (/jobs\.lever\.co/i.test(url)) return true;
    const isLever = await page.evaluate(() => {
      return !!document.querySelector('.application-form, form[action*="lever"], #application-form');
    }).catch(() => false);
    return isLever;
  }

  async submit(page) {
    logger.info('LeverAdapter: Submitting application');
    const submitBtn = page.locator('#btn-submit, button:has-text("Submit application"), input[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    return {
      success: true,
      confirmationText: 'Lever application successfully submitted'
    };
  }
}

module.exports = LeverAdapter;
