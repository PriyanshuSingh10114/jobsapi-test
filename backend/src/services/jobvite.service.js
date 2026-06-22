const logger = require('../config/logger');

// Jobvite scraping usually requires parsing their proprietary XML feeds or iframe HTML.
const jobviteCompanies = [];

const fetchJobs = async () => {
  logger.info('Jobvite integration is running in skeleton mode. XML parser needed.');
  return [];
};

module.exports = { fetchJobs };
