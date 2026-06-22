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

const greenhouseCompanies = require('../data/greenhouse_companies');
const pLimit = require('../utils/concurrency');
const fs = require('fs');
const path = require('path');

const fetchJobs = async () => {
  const companies = greenhouseCompanies;
  let allJobs = [];
  let companiesFailed = 0;

  const limit = pLimit(10);
  const logPath = path.join(process.cwd(), 'greenhouse_failed_companies.log');

  const promises = companies.map(company => limit(async () => {
    const companyTrimmed = company.trim();
    const companyJobs = await fetchJobsForCompany(companyTrimmed);
    if (companyJobs.length === 0) {
      companiesFailed++;
      // Since fetchJobsForCompany catches its own errors and returns [],
      // we log failed companies here to comply with the requirement.
      fs.appendFileSync(logPath, `${new Date().toISOString()} - {"company":"${companyTrimmed}","status":404}\n`);
    } else {
      allJobs.push(...companyJobs);
    }
  }));

  await Promise.all(promises);

  return { jobs: allJobs, companiesScanned: companies.length, companiesFailed };
};

module.exports = { fetchJobs };
