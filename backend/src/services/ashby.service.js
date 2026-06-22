const axios = require('axios');
const logger = require('../config/logger');
const { normalizeJobType } = require('../utils/jobTypeNormalizer');

const fetchJobsForCompany = async (companyToken) => {
  try {
    const response = await axios.get(`https://api.ashbyhq.com/posting-api/job-board/${companyToken}`);
    const jobs = response.data.jobs || [];
    
    return jobs.map(job => ({
      title: job.title,
      company: companyToken.charAt(0).toUpperCase() + companyToken.slice(1),
      location: job.location || 'Unknown',
      source: 'Ashby',
      applyUrl: job.jobUrl,
      description: job.title, // Keep simple
      postedAt: new Date(job.publishedAt || new Date()),
      remote: job.isRemote || false,
      jobType: normalizeJobType(job.employmentType || '', job.title),
    }));
  } catch (error) {
    logger.warn(`Ashby API Error for ${companyToken}: ${error.message}`);
    return [];
  }
};

const fetchJobs = async () => {
  const companies = (process.env.ASHBY_COMPANIES || '').split(',').filter(Boolean);
  let allJobs = [];

  for (const company of companies) {
    const companyJobs = await fetchJobsForCompany(company.trim());
    allJobs = allJobs.concat(companyJobs);
  }

  return allJobs;
};

module.exports = { fetchJobs };
