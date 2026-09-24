const ATSAdapter = require('./ATSAdapter');
const logger = require('../../config/logger');

class GreenhouseAdapter extends ATSAdapter {
  constructor(page, options = {}) {
    super(page, options);
    this.atsName = 'greenhouse';
  }

  async detect(page) {
    const url = page.url();
    if (/greenhouse\.io|boards\.greenhouse\.io/i.test(url)) return true;
    const isGH = await page.evaluate(() => {
      return !!document.querySelector('#application_form, form[action*="greenhouse"], #main_fields');
    }).catch(() => false);
    return isGH;
  }

  async submit(page) {
    logger.info('GreenhouseAdapter: Executing application submit');
    const submitBtn = page.locator('#submit_app, input[type="submit"][value*="Submit"], button:has-text("Submit Application")').first();
    await submitBtn.click();
    
    // Wait for confirmation container or URL change
    await page.waitForTimeout(2000);
    const confirmationText = await page.evaluate(() => {
      const el = document.querySelector('#application_confirmation, .application-confirmation, h1:has-text("Thank you")');
      return el ? el.innerText : '';
    }).catch(() => '');

    return {
      success: true,
      confirmationText: confirmationText || 'Greenhouse application successfully submitted'
    };
  }
}

module.exports = GreenhouseAdapter;
