const axios = require('axios');
const logger = require('../config/logger');

// Teamtailor requires API tokens for /v1/jobs but sometimes exposes RSS feeds.
// For now, skeleton.
const teamtailorCompanies = [];

const fetchJobs = async () => {
  logger.info('Teamtailor integration is running in skeleton mode. API token needed.');
  return [];
};

module.exports = { fetchJobs };
