const BrowserSession = require('../../models/BrowserSession');
const logger = require('../../config/logger');

class SessionManager {
  
  static async getOrCreateSession(userId, connectorName) {
    let session = await BrowserSession.findOne({ userId, connectorName, status: 'Active' });
    
    if (!session) {
      const sessionId = `sess_${userId}_${connectorName}_${Date.now()}`;
      session = new BrowserSession({
        sessionId,
        userId,
        connectorName,
        cookies: [],
        status: 'Active'
      });
      await session.save();
      logger.info(`Created new BrowserSession: ${sessionId}`);
    } else {
      logger.info(`Found active BrowserSession: ${session.sessionId}`);
    }
    
    return session;
  }

  static async saveSessionData(sessionId, sessionData) {
    try {
      const session = await BrowserSession.findOne({ sessionId });
      if (session) {
        if (sessionData.cookies) {
           session.cookies = sessionData.cookies;
        }
        session.lastUsedAt = new Date();
        await session.save();
        logger.info(`Updated session data for ${sessionId}`);
      }
    } catch (error) {
      logger.error(`Error saving session data: ${error.message}`);
    }
  }

  static async markSessionClosed(sessionId) {
    await BrowserSession.updateOne({ sessionId }, { status: 'Closed' });
  }
}

module.exports = SessionManager;
