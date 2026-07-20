const logger = require('../../config/logger');

class ResumeSelector {
  constructor(profileData, jobData) {
    this.assets = profileData.assets || [];
    this.jobData = jobData;
  }

  selectBestResume() {
    logger.info('Running AI Resume Selection...');
    
    if (!this.assets || this.assets.length === 0) {
      logger.warn('No resume assets available for selection.');
      return null;
    }

    // Filter to only resume assets (excluding pure portfolios/certificates if they have flags)
    const resumes = this.assets.filter(a => !a.isPortfolio && !a.isCertificate);

    if (resumes.length === 0) {
      return this.assets[0].filePath; // Fallback to first asset
    }

    // In a full AI implementation, this would score each resume against jobData.description
    // For now, return the one with highest atsScore or the first one.
    const sorted = [...resumes].sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0));
    const selected = sorted[0];

    logger.info(`Selected Resume: ${selected.name} with score ${selected.atsScore}`);
    return selected.filePath;
  }
}

module.exports = ResumeSelector;
