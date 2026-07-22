const BrowserManager = require('./BrowserManager');
const logger = require('../../config/logger');

class BrowserPool {
  constructor() {
    this.maxInstances = 1;
    this.pool = [];
    this.inUse = new Set();
    this.activeAcquisitions = new Map(); // sessionId -> browser
  }

  async initialize() {
    logger.info('BrowserPool initialized in lazy mode.');
  }

  async addNewBrowser() {
    const isDev = process.env.NODE_ENV === 'development';
    const manager = new BrowserManager({ headless: !isDev }); // Set to false only in dev for real-time viewing
    const browser = await manager.launch();
    
    browser.on('disconnected', () => {
      logger.warn(`Browser disconnected. Removing from pool.`);
      this.pool = this.pool.filter(b => b !== browser);
      this.inUse.delete(browser);
      for (const [sId, b] of this.activeAcquisitions.entries()) {
        if (b === browser) this.activeAcquisitions.delete(sId);
      }
      // Removed auto-replace on crash to prevent multiple browser windows spanning. It will lazily replace on next acquire.
    });

    this.pool.push(browser);
    return browser;
  }

  async acquire(sessionId = 'default') {
    if (this.activeAcquisitions.has(sessionId)) {
      const err = new Error(`[BrowserPool Violation] Multiple BrowserPool.acquire() attempted for session: ${sessionId}. Exactly one browser acquisition is permitted per automation job.`);
      logger.error(err.message);
      throw err;
    }

    // Find first available browser
    const availableBrowser = this.pool.find(b => !this.inUse.has(b));
    let browser;
    
    if (availableBrowser) {
      this.inUse.add(availableBrowser);
      browser = availableBrowser;
    } else if (this.pool.length < this.maxInstances) {
      browser = await this.addNewBrowser();
      this.inUse.add(browser);
    } else {
      throw new Error('No browsers available in pool. Wait and retry.');
    }

    this.activeAcquisitions.set(sessionId, browser);
    return browser;
  }

  release(browser, sessionId = null) {
    if (this.inUse.has(browser)) {
      this.inUse.delete(browser);
    }
    if (sessionId && this.activeAcquisitions.has(sessionId)) {
      this.activeAcquisitions.delete(sessionId);
    } else {
      for (const [sId, b] of this.activeAcquisitions.entries()) {
        if (b === browser) {
          this.activeAcquisitions.delete(sId);
          break;
        }
      }
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
