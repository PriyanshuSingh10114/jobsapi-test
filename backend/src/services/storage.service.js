const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config');
const { ValidationError } = require('../errors/AppErrors');
const logger = require('../config/logger');

/**
 * Storage Service Abstraction
 * Manages secure file storage, sanitization, and URL generation.
 */
class LocalStorageService {
  constructor() {
    this.baseUploadDir = path.resolve(process.cwd(), config.STORAGE.uploadDir);
    this.resumeDir = path.join(this.baseUploadDir, 'resumes');
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.resumeDir)) {
      fs.mkdirSync(this.resumeDir, { recursive: true });
    }
  }

  /**
   * Generates a collision-resistant, cryptographically randomized filename.
   */
  generateSecureFilename(originalName, prefix = 'resume') {
    const ext = path.extname(originalName).toLowerCase();
    if (!['.pdf', '.docx', '.doc'].includes(ext)) {
      throw new ValidationError('Invalid file extension. Only .pdf, .docx, and .doc are permitted.');
    }
    const randomUuid = crypto.randomUUID();
    return `${prefix}-${randomUuid}${ext}`;
  }

  /**
   * Sanitizes and verifies path containment to prevent path traversal attacks.
   */
  sanitizePath(filename, subDir = 'resumes') {
    const safeFilename = path.basename(filename);
    const targetPath = path.join(this.baseUploadDir, subDir, safeFilename);
    const normalized = path.normalize(targetPath);

    if (!normalized.startsWith(this.baseUploadDir)) {
      throw new ValidationError('Illegal path traversal attempt detected');
    }
    return normalized;
  }

  /**
   * Converts local filename into a safe public API asset URL.
   */
  getPublicUrl(filename, subDir = 'resumes') {
    const safeFilename = path.basename(filename);
    return `/uploads/${subDir}/${safeFilename}`;
  }

  /**
   * Deletes a stored asset.
   */
  async deleteFile(filename, subDir = 'resumes') {
    try {
      const filePath = this.sanitizePath(filename, subDir);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.info(`[StorageService] Deleted file: ${safeFilename}`);
      }
    } catch (err) {
      logger.error(`[StorageService] Failed to delete file: ${err.message}`);
    }
  }
}

module.exports = new LocalStorageService();
