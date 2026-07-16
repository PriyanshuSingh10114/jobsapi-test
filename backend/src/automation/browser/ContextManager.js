const BrowserManager = require('./BrowserManager');
const logger = require('../../config/logger');

class ContextManager {
  constructor(browser) {
    this.browser = browser;
  }

  async createContext(options = {}) {
    try {
      const defaultOptions = {
        userAgent: BrowserManager.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
        locale: 'en-US',
        timezoneId: 'America/New_York',
        permissions: [],
        ignoreHTTPSErrors: true,
      };

      const contextOptions = { ...defaultOptions, ...options };
      
      logger.info('Creating isolated browser context...', { userAgent: contextOptions.userAgent });
      const context = await this.browser.newContext(contextOptions);
      
      // Inject bot evasion scripts if needed here (e.g. stealth plugin equivalent)
      await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      return context;
    } catch (error) {
      logger.error(`Failed to create browser context: ${error.message}`);
      throw error;
    }
  }

  async injectSessionData(context, sessionData) {
    if (!sessionData) return;
    
    try {
      if (sessionData.cookies && sessionData.cookies.length > 0) {
        await context.addCookies(sessionData.cookies);
        logger.info(`Injected ${sessionData.cookies.length} cookies into context.`);
      }

      // LocalStorage injection is trickier in Playwright because it requires a domain to be loaded.
      // Usually done by navigating to the domain first, then executing script. 
      // Handled at the connector level.
    } catch (error) {
      logger.error(`Failed to inject session data: ${error.message}`);
    }
  }
  
  async extractSessionData(context) {
    try {
      const cookies = await context.cookies();
      return { cookies };
    } catch (error) {
      logger.error(`Failed to extract session data: ${error.message}`);
      return { cookies: [] };
    }
  }
}

module.exports = ContextManager;
