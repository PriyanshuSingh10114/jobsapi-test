const axios = require('axios');
const logger = require('../config/logger');
const { normalizeJobType } = require('../utils/jobTypeNormalizer');

class BaseAtsService {
  constructor(atsName) {
    this.atsName = atsName;
  }

  async fetchEndpoint(url, config = {}) {
    try {
      const response = await axios.get(url, { timeout: 10000, ...config });
      return response.data;
    } catch (error) {
      logger.warn(`[${this.atsName}] API Error fetching ${url}: ${error.message}`);
      return null;
    }
  }

  normalizeJobData(jobData) {
    return {
      title: jobData.title || 'Unknown Title',
      company: jobData.company || 'Unknown Company',
      location: jobData.location || 'Unknown',
      source: this.atsName,
      applyUrl: jobData.applyUrl || '',
      description: jobData.description || jobData.title || '',
      postedAt: jobData.postedAt ? new Date(jobData.postedAt) : new Date(),
      remote: jobData.remote || false,
      jobType: normalizeJobType(jobData.jobType, jobData.title),
      experienceLevel: jobData.experienceLevel || 'Mid Level'
    };
  }
}

module.exports = BaseAtsService;
