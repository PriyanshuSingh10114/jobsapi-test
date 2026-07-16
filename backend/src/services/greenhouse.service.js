const { fetchWithRetry } = require('../core/httpClient');
const pLimit = require('../utils/concurrency');
const { normalizeJobType } = require('../utils/jobTypeNormalizer');
const path = require('path');
const fs = require('fs');

const fetchJobs = async (syncLogger) => {
  const configPath = path.join(__dirname, '../config/connectors/greenhouse.json');
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
    const companyTrimmed = company.trim();
    const result = await fetchWithRetry(`https://boards-api.greenhouse.io/v1/boards/${companyTrimmed}/jobs`);
    
    syncLogger.logRequest(result.durationMs, result.success, result.retries, result.errorClass);

    if (!result.success || !result.data || !result.data.jobs) {
      companiesFailed++;
      return;
    }

    const jobs = result.data.jobs;
    if (jobs.length === 0) return;

    allJobs.push(...jobs.map(job => ({
      title: job.title,
      company: companyTrimmed.charAt(0).toUpperCase() + companyTrimmed.slice(1),
      location: job.location?.name || 'Unknown',
      source: 'Greenhouse',
      applyUrl: job.absolute_url,
      description: job.title,
      postedAt: new Date(job.updated_at),
      remote: job.location?.name?.toLowerCase().includes('remote') || false,
      jobType: normalizeJobType('', job.title),
    })));
  }));

  await Promise.all(promises);

  return { jobs: allJobs, companiesScanned: companies.length, companiesFailed };
};

module.exports = { fetchJobs };
