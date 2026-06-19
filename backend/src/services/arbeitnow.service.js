const axios = require('axios');
const logger = require('../config/logger');

const fetchJobs = async () => {
  try {
    const response = await axios.get('https://arbeitnow.com/api/job-board-api');
    const jobs = response.data.data;
    
    return jobs.map(job => ({
      title: job.title,
      company: job.company_name,
      location: job.location,
      source: 'Arbeitnow',
      applyUrl: job.url,
      description: job.description,
      postedAt: job.created_at ? new Date(job.created_at * 1000) : new Date(),
      remote: job.remote,
    }));
  } catch (error) {
    logger.error(`Arbeitnow API Error: ${error.message}`);
    throw error;
  }
};

module.exports = { fetchJobs };
