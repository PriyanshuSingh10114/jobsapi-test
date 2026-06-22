const axios = require('axios');
const logger = require('../config/logger');
const { normalizeJobType } = require('../utils/jobTypeNormalizer');

const leverCompanies = require('../data/lever_companies');
const fs = require('fs');
const path = require('path');

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
      jobType: normalizeJobType(job.categories?.commitment || '', job.text),
    }));
  } catch (error) {
    logger.warn(`Lever API Error for ${companyToken}: ${error.message}`);
    const logPath = path.join(process.cwd(), 'lever_failed_companies.log');
    fs.appendFileSync(logPath, `${new Date().toISOString()} - ${companyToken}\n`);
    return [];
  }
};

const fetchJobs = async () => {
  const companies = leverCompanies;
  let allJobs = [];
  let companiesFailed = 0;

  for (const company of companies) {
    const companyJobs = await fetchJobsForCompany(company.trim());
    if (companyJobs.length === 0) companiesFailed++;
    allJobs = allJobs.concat(companyJobs);
  }

  return { jobs: allJobs, companiesScanned: companies.length, companiesFailed };
};

module.exports = { fetchJobs };
