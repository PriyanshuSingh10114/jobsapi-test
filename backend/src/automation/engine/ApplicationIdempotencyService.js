const crypto = require('crypto');
const ApplicationSession = require('../../models/ApplicationSession');
const logger = require('../../config/logger');

class ApplicationIdempotencyService {
  /**
   * Generates a deterministic idempotency key for candidate + job + destination
   * @param {string} candidateId
   * @param {string} jobId
   * @param {string} destination
   * @returns {string} SHA-256 hash
   */
  static generateKey(candidateId, jobId, destination = '') {
    const raw = `${String(candidateId).trim()}:${String(jobId).trim()}:${String(destination).trim().toLowerCase()}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  static generateFingerprint(candidateId, jobId, destination = '') {
    return this.generateKey(candidateId, jobId, destination);
  }

  /**
   * Verifies whether an application has already been submitted or is currently running
   * @param {string} candidateId
   * @param {string} jobId
   * @param {string} destination
   * @returns {Promise<{ isDuplicate: boolean, existingSession: Object|null }>}
   */
  static async checkDuplicate(candidateId, jobId, destination = '') {
    const existing = await ApplicationSession.findOne({
      userId: candidateId,
      jobId,
      status: { $in: ['SUBMITTED', 'COMPLETED', 'RUNNING', 'PROCESSING'] }
    }).lean();

    if (existing) {
      logger.warn(`ApplicationIdempotencyService: Duplicate submission prevented for candidate ${candidateId} on job ${jobId}`);
      return {
        isDuplicate: true,
        existingSession: existing
      };
    }

    return {
      isDuplicate: false,
      existingSession: null
    };
  }
}

module.exports = ApplicationIdempotencyService;
