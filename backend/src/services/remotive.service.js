const axios = require('axios');
const logger = require('../config/logger');

const fetchJobs = async () => {
  try {
    const response = await axios.get('https://remotive.com/api/remote-jobs');
    const jobs = response.data.jobs;
    
    return jobs.map(job => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location,
      source: 'Remotive',
      applyUrl: job.url,
      description: job.description,
      postedAt: new Date(job.publication_date),
      remote: true, // All jobs on Remotive are remote
    }));
  } catch (error) {
    logger.error(`Remotive API Error: ${error.message}`);
    throw error;
  }
};

module.exports = { fetchJobs };
