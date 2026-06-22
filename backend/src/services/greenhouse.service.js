const axios = require('axios');
const logger = require('../config/logger');
const { normalizeJobType } = require('../utils/jobTypeNormalizer');

const fetchJobsForCompany = async (companyToken) => {
  try {
    const response = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${companyToken}/jobs`);
    const jobs = response.data.jobs || [];
    
    return jobs.map(job => ({
      title: job.title,
      company: companyToken.charAt(0).toUpperCase() + companyToken.slice(1),
      location: job.location?.name || 'Unknown',
      source: 'Greenhouse',
      applyUrl: job.absolute_url,
      description: job.title, // Description usually needs a secondary API call, keeping it simple
      postedAt: new Date(job.updated_at),
      remote: job.location?.name?.toLowerCase().includes('remote') || false,
      jobType: normalizeJobType('', job.title), // Greenhouse doesn't return job type in basic API by default
    }));
  } catch (error) {
    logger.warn(`Greenhouse API Error for ${companyToken}: ${error.message}`);
    return []; // Return empty array on failure so one bad company doesn't crash sync
  }
};

const fetchJobs = async () => {
  const companies = (process.env.GREENHOUSE_COMPANIES || '').split(',').filter(Boolean);
  let allJobs = [];

  for (const company of companies) {
    const companyJobs = await fetchJobsForCompany(company.trim());
    allJobs = allJobs.concat(companyJobs);
  }

  return allJobs;
};

module.exports = { fetchJobs };
