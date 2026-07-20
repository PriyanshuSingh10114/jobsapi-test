const BrowserManager = require('./BrowserManager');
const logger = require('../../config/logger');

class BrowserPool {
  constructor(maxInstances = 3) {
    this.maxInstances = maxInstances;
    this.pool = [];
    this.inUse = new Set();
  }

  async initialize() {
    logger.info(`Initializing BrowserPool with ${this.maxInstances} instances...`);
    for (let i = 0; i < this.maxInstances; i++) {
      await this.addNewBrowser();
    }
    logger.info(`BrowserPool initialized. Available: ${this.pool.length}`);
  }

  async addNewBrowser() {
    const isDev = process.env.NODE_ENV === 'development';
    const manager = new BrowserManager({ headless: !isDev }); // Set to false only in dev for real-time viewing
    const browser = await manager.launch();
    
    // Auto-replace on crash
    browser.on('disconnected', () => {
      logger.warn(`Browser disconnected. Removing from pool.`);
      this.pool = this.pool.filter(b => b !== browser);
      this.inUse.delete(browser);
      this.addNewBrowser().catch(err => logger.error(`Failed to replace crashed browser: ${err.message}`));
    });

    this.pool.push(browser);
    return browser;
  }

  async acquire() {
    // Find first available browser
    const availableBrowser = this.pool.find(b => !this.inUse.has(b));
    
    if (availableBrowser) {
      this.inUse.add(availableBrowser);
      return availableBrowser;
    }

    if (this.pool.length < this.maxInstances) {
      const newBrowser = await this.addNewBrowser();
      this.inUse.add(newBrowser);
      return newBrowser;
    }

    throw new Error('No browsers available in pool. Wait and retry.');
  }

  release(browser) {
    if (this.inUse.has(browser)) {
      this.inUse.delete(browser);
    }
  }

  async closeAll() {
    logger.info('Closing all browsers in pool...');
    for (const browser of this.pool) {
      await browser.close();
    }
    this.pool = [];
    this.inUse.clear();
  }
}

// Singleton export
module.exports = new BrowserPool();
