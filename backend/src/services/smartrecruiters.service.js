const axios = require('axios');
const logger = require('../config/logger');

const smartrecruitersCompanies = ['ubisoft', 'bayer', 'visa'];

const fetchJobsForCompany = async (company) => {
  try {
    const response = await axios.get(`https://api.smartrecruiters.com/v1/companies/${company}/postings`);
    const jobs = response.data.content || [];
    
    return jobs.map(job => ({
      title: job.name,
      company: company.charAt(0).toUpperCase() + company.slice(1),
      location: job.location?.city || 'Unknown',
      source: 'SmartRecruiters',
      applyUrl: `https://jobs.smartrecruiters.com/${company}/${job.id}`,
      description: job.name, 
      postedAt: new Date(job.releasedDate || new Date()),
      remote: job.location?.remote || false,
      jobType: job.typeOfEmployment?.label || 'Full-time',
    }));
  } catch (error) {
    logger.warn(`SmartRecruiters API Error for ${company}: ${error.message}`);
    return [];
  }
};

const fetchJobs = async () => {
  let allJobs = [];
  for (const company of smartrecruitersCompanies) {
    const companyJobs = await fetchJobsForCompany(company);
    allJobs = allJobs.concat(companyJobs);
  }
  return allJobs;
};

module.exports = { fetchJobs };
