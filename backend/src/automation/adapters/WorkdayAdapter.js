const ATSAdapter = require('./ATSAdapter');
const logger = require('../../config/logger');

class WorkdayAdapter extends ATSAdapter {
  constructor(page, options = {}) {
    super(page, options);
    this.atsName = 'workday';
  }

  async detect(page) {
    const url = page.url();
    if (/myworkdayjobs\.com|workday\.com/i.test(url)) return true;
    const isWorkday = await page.evaluate(() => {
      return !!document.querySelector('[data-automation-id], div[id*="workday"]');
    }).catch(() => false);
    return isWorkday;
  }

  async submit(page) {
    logger.info('WorkdayAdapter: Submitting application');
    const submitBtn = page.locator('[data-automation-id="bottom-navigation-next-button"], button:has-text("Submit")').first();
    await submitBtn.click();
    await page.waitForTimeout(2000);

    return {
      success: true,
      confirmationText: 'Workday application successfully submitted'
    };
  }
}

module.exports = WorkdayAdapter;
