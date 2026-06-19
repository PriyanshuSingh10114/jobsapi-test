const axios = require('axios');
const logger = require('../config/logger');

const fetchJobsForCompany = async (companyToken) => {
  try {
    const response = await axios.get(`https://api.lever.co/v0/postings/${companyToken}?mode=json`);
    const jobs = response.data || [];
    
    return jobs.map(job => ({
      title: job.text,
      company: companyToken.charAt(0).toUpperCase() + companyToken.slice(1),
      location: job.categories?.location || 'Unknown',
      source: 'Lever',
      applyUrl: job.applyUrl || job.hostedUrl,
      description: job.descriptionPlain || job.description,
      postedAt: new Date(job.createdAt),
      remote: job.categories?.commitment === 'Remote' || job.categories?.location?.toLowerCase().includes('remote') || false,
    }));
  } catch (error) {
    logger.warn(`Lever API Error for ${companyToken}: ${error.message}`);
    return [];
  }
};

const fetchJobs = async () => {
  const companies = (process.env.LEVER_COMPANIES || '').split(',').filter(Boolean);
  let allJobs = [];

  for (const company of companies) {
    const companyJobs = await fetchJobsForCompany(company.trim());
    allJobs = allJobs.concat(companyJobs);
  }

  return allJobs;
};

module.exports = { fetchJobs };
