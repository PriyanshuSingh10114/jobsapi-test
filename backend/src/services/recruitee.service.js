const axios = require('axios');
const logger = require('../config/logger');

const recruiteeCompanies = ['bunq'];

const fetchJobsForCompany = async (company) => {
  try {
    const response = await axios.get(`https://${company}.recruitee.com/api/offers`);
    const jobs = response.data.offers || [];
    
    return jobs.map(job => ({
      title: job.title,
      company: job.company_name || company,
      location: job.location || 'Unknown',
      source: 'Recruitee',
      applyUrl: job.careers_url,
      description: job.description || job.title,
      postedAt: new Date(job.published_at || new Date()),
      remote: job.remote || false,
      jobType: job.employment_type_code || 'Full-time',
    }));
  } catch (error) {
    logger.warn(`Recruitee API Error for ${company}: ${error.message}`);
    return [];
  }
};

const fetchJobs = async () => {
  let allJobs = [];
  for (const company of recruiteeCompanies) {
    const companyJobs = await fetchJobsForCompany(company);
    allJobs = allJobs.concat(companyJobs);
  }
  return allJobs;
};

module.exports = { fetchJobs };
