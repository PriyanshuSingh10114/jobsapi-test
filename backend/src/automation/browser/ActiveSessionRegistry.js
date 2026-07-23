const logger = require('../../config/logger');

class ActiveSessionRegistry {
  constructor() {
    this.sessions = new Map(); // sessionId -> automationContext
  }

  /**
   * Registers an active automation session.
   * @param {string} sessionId 
   * @param {Object} automationContext 
   */
  register(sessionId, automationContext) {
    if (!sessionId || !automationContext) return;
    this.sessions.set(sessionId, automationContext);
    logger.info(`[ActiveSessionRegistry] Registered active session: ${sessionId}`);
  }

  /**
   * Retrieves an active automation session.
   * @param {string} sessionId 
   * @returns {Object|null} automationContext
   */
  get(sessionId) {
    if (!sessionId) return null;
    const session = this.sessions.get(sessionId) || null;
    if (session) {
      logger.info(`[ActiveSessionRegistry] Retrieved active session: ${sessionId}`);
    }
    return session;
  }

  /**
   * Checks if an active session exists and is still valid.
   * @param {string} sessionId 
   * @returns {boolean}
   */
  has(sessionId) {
    if (!sessionId) return false;
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    // Check if underlying browser/page is closed
    try {
      if (session.browser && !session.browser.isConnected()) {
        this.unregister(sessionId);
        return false;
      }
      if (session.page && session.page.isClosed()) {
        this.unregister(sessionId);
        return false;
      }
      return true;
    } catch (e) {
      this.unregister(sessionId);
      return false;
    }
  }

  /**
   * Unregisters an active automation session.
   * @param {string} sessionId 
   */
  unregister(sessionId) {
    if (!sessionId) return;
    if (this.sessions.has(sessionId)) {
      this.sessions.delete(sessionId);
      logger.info(`[ActiveSessionRegistry] Unregistered active session: ${sessionId}`);
    }
  }

  /**
   * Clears all registered sessions.
   */
  clear() {
    this.sessions.clear();
    logger.info('[ActiveSessionRegistry] Cleared all sessions.');
  }
}

module.exports = new ActiveSessionRegistry();
