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

const ashbyCompanies = require('../data/ashby_companies_validated.json');
const pLimit = require('../utils/concurrency');
const fs = require('fs');
const path = require('path');

const fetchJobs = async () => {
  const companies = ashbyCompanies;
  let allJobs = [];
  let companiesFailed = 0;

  const limit = pLimit(10);
  const logPath = path.join(process.cwd(), 'ashby_failed_companies.log');

  const promises = companies.map(company => limit(async () => {
    const companyTrimmed = company.trim();
    const companyJobs = await fetchJobsForCompany(companyTrimmed);
    if (companyJobs.length === 0) {
      companiesFailed++;
      fs.appendFileSync(logPath, `${new Date().toISOString()} - {"company":"${companyTrimmed}","status":404}\n`);
    } else {
      allJobs.push(...companyJobs);
    }
  }));

  await Promise.all(promises);

  return { jobs: allJobs, companiesScanned: companies.length, companiesFailed };
};

module.exports = { fetchJobs };
