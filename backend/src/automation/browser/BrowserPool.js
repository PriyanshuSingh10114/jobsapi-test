const BrowserManager = require('./BrowserManager');
const ActiveSessionRegistry = require('./ActiveSessionRegistry');
const logger = require('../../config/logger');
const { BrowserUnavailableError } = require('../errors/CustomErrors');

class BrowserPool {
  constructor() {
    this.maxInstances = parseInt(process.env.BROWSER_POOL_SIZE || '5', 10);
    this.pool = []; // Array of { browser, status: 'Available' | 'InUse' | 'Reserved', sessionId: string | null }
    this.waitQueue = []; // Array of resolve functions waiting for an available browser
    this.activeAcquisitions = new Map(); // sessionId -> browser
  }

  async initialize() {
    logger.info(`BrowserPool initialized with concurrency size: ${this.maxInstances}`);
  }

  async addNewBrowser() {
    const isDev = process.env.NODE_ENV === 'development';
    const manager = new BrowserManager({ headless: !isDev });
    const browser = await manager.launch();
    
    const poolItem = { browser, status: 'Available', sessionId: null };

    browser.on('disconnected', () => {
      logger.warn(`Browser disconnected. Cleaning up pool item.`);
      this.pool = this.pool.filter(item => item.browser !== browser);
      for (const [sId, b] of this.activeAcquisitions.entries()) {
        if (b === browser) this.activeAcquisitions.delete(sId);
      }
    });

    this.pool.push(poolItem);
    return poolItem;
  }

  async acquire(sessionId = 'default') {
    // 1. Re-use existing browser from ActiveSessionRegistry if session is paused or active
    if (ActiveSessionRegistry.has(sessionId)) {
      const activeSession = ActiveSessionRegistry.get(sessionId);
      logger.info(`[BrowserPool] Reusing existing active browser instance for session: ${sessionId}`);
      return activeSession.browser;
    }

    if (this.activeAcquisitions.has(sessionId)) {
      const existingBrowser = this.activeAcquisitions.get(sessionId);
      if (existingBrowser && existingBrowser.isConnected()) {
        return existingBrowser;
      }
      this.activeAcquisitions.delete(sessionId);
    }

    // 2. Find an available idle browser item in pool
    let item = this.pool.find(i => i.status === 'Available' && i.browser.isConnected());
    
    if (!item && this.pool.length < this.maxInstances) {
      item = await this.addNewBrowser();
    }

    // 3. If pool is exhausted, queue the request asynchronously instead of throwing an error immediately
    if (!item) {
      logger.warn(`[BrowserPool] Pool exhausted (${this.pool.length}/${this.maxInstances}). Queuing request for session ${sessionId}...`);
      
      const timeoutMs = 30000; // 30 seconds wait timeout
      const queuedItemPromise = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const idx = this.waitQueue.findIndex(q => q.resolve === resolve);
          if (idx !== -1) this.waitQueue.splice(idx, 1);
          reject(new BrowserUnavailableError(`Browser Pool acquisition timed out after ${timeoutMs}ms`, { sessionId }));
        }, timeoutMs);

        this.waitQueue.push({ resolve, timer, sessionId });
      });

      return await queuedItemPromise;
    }

    item.status = 'InUse';
    item.sessionId = sessionId;
    this.activeAcquisitions.set(sessionId, item.browser);
    return item.browser;
  }

  reserve(browser, sessionId) {
    const item = this.pool.find(i => i.browser === browser);
    if (item) {
      item.status = 'Reserved';
      item.sessionId = sessionId;
      logger.info(`[BrowserPool] Browser reserved for WaitingForUser session ${sessionId}`);
    }
  }

  release(browser, sessionId = null) {
    const item = this.pool.find(i => i.browser === browser);
    if (item) {
      item.status = 'Available';
      item.sessionId = null;
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

    // Process queued acquisition requests if any
    if (this.waitQueue.length > 0) {
      const nextRequest = this.waitQueue.shift();
      clearTimeout(nextRequest.timer);
      
      this.acquire(nextRequest.sessionId)
        .then(nextRequest.resolve)
        .catch(err => logger.error(`[BrowserPool] Failed queued acquisition for ${nextRequest.sessionId}: ${err.message}`));
    }
  }

  async closeAll() {
    logger.info('Closing all browsers in pool...');
    for (const item of this.pool) {
      try {
        if (item.browser && item.browser.isConnected()) {
          await item.browser.close();
        }
      } catch (e) {}
    }
    this.pool = [];
    this.waitQueue = [];
    this.activeAcquisitions.clear();
  }
}

module.exports = new BrowserPool();
