const axios = require('axios');
const logger = require('../config/logger');
const { normalizeJobType } = require('../utils/jobTypeNormalizer');

const leverCompanies = require('../data/lever_companies');
const fs = require('fs');
const path = require('path');

const validateLeverCompany = async (companyToken) => {
  logger.info(`[Lever] Testing company: ${companyToken}`);
  try {
    const response = await axios.get(`https://api.lever.co/v0/postings/${companyToken}?mode=json`);
    const jobs = response.data || [];
    logger.info(`[Lever] Jobs found: ${jobs.length}`);
    return jobs;
  } catch (error) {
    logger.warn(`Lever API Error for ${companyToken}: ${error.response?.status || error.message}`);
    const logPath = path.join(process.cwd(), 'lever_failed_companies.log');
    fs.appendFileSync(logPath, `${new Date().toISOString()} - {"company":"${companyToken}","status":${error.response?.status || 500}}\n`);
    return null;
  }
};

const fetchJobsForCompany = async (companyToken, jobsData) => {
  try {
    return jobsData.map(job => ({
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
    logger.error(`Error processing Lever jobs for ${companyToken}: ${error.message}`);
    return [];
  }
};

const fetchJobs = async () => {
  const companies = leverCompanies;
  let allJobs = [];
  let companiesFailed = 0;

  for (const company of companies) {
    const companyToken = company.trim();
    const rawJobs = await validateLeverCompany(companyToken);
    
    if (!rawJobs) {
      companiesFailed++;
      continue;
    }

    const companyJobs = await fetchJobsForCompany(companyToken, rawJobs);
    allJobs = allJobs.concat(companyJobs);
  }

  return { jobs: allJobs, companiesScanned: companies.length, companiesFailed };
};

module.exports = { fetchJobs };
