const axios = require('axios');
const logger = require('../config/logger');

// BambooHR uses XML feeds: https://{company}.bamboohr.com/jobs/xml.php
// Requires fast-xml-parser or similar to parse. Building skeleton.
const bamboohrCompanies = [];

const fetchJobs = async () => {
  logger.info('BambooHR integration is running in skeleton mode. XML parser needed.');
  return [];
};

module.exports = { fetchJobs };
