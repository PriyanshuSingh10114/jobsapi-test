const { chromium } = require('playwright');
const logger = require('../../config/logger');

class BrowserManager {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== undefined ? options.headless : true,
      proxy: options.proxy || null,
      timeout: options.timeout || 30000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        ...(options.args || [])
      ]
    };
  }

  async launch() {
    try {
      logger.info('Launching Chromium browser...', { options: this.options });
      
      const launchOptions = {
        headless: this.options.headless,
        args: this.options.args,
        timeout: this.options.timeout
      };

      if (this.options.proxy) {
        launchOptions.proxy = { server: this.options.proxy };
      }

      const browser = await chromium.launch(launchOptions);
      logger.info('Browser launched successfully.');
      return browser;
    } catch (error) {
      logger.error(`Failed to launch browser: ${error.message}`);
      throw error;
    }
  }

  static getRandomUserAgent() {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }
}

module.exports = BrowserManager;
