const { fetchWithRetry } = require('../core/httpClient');
const pLimit = require('../utils/concurrency');
const path = require('path');
const fs = require('fs');

const fetchJobs = async (syncLogger) => {
  const configPath = path.join(__dirname, '../config/connectors/smartrecruiters.json');
  let companies = [];
  try {
    companies = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to load config: ${err.message}`);
  }

  let allJobs = [];
  let companiesFailed = 0;
  const limit = pLimit(10);

  const promises = companies.map(company => limit(async () => {
    const result = await fetchWithRetry(`https://api.smartrecruiters.com/v1/companies/${company}/postings`);
    syncLogger.logRequest(result.durationMs, result.success, result.retries, result.errorClass);

    if (!result.success || !result.data || !result.data.content) {
      companiesFailed++;
      return;
    }

    const jobs = result.data.content;
    allJobs.push(...jobs.map(job => ({
      title: job.name,
      company: company.charAt(0).toUpperCase() + company.slice(1),
      location: job.location?.city || 'Unknown',
      source: 'SmartRecruiters',
      applyUrl: `https://jobs.smartrecruiters.com/${company}/${job.id}`,
      description: job.name, 
      postedAt: new Date(job.releasedDate || new Date()),
      remote: job.location?.remote || false,
      jobType: job.typeOfEmployment?.label || 'Full-time',
    })));
  }));

  await Promise.all(promises);

  return { jobs: allJobs, companiesScanned: companies.length, companiesFailed };
};

module.exports = { fetchJobs };
