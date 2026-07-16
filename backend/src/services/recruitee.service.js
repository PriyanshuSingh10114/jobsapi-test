const { fetchWithRetry } = require('../core/httpClient');
const pLimit = require('../utils/concurrency');
const path = require('path');
const fs = require('fs');

const fetchJobs = async (syncLogger) => {
  const configPath = path.join(__dirname, '../config/connectors/recruitee.json');
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
    const result = await fetchWithRetry(`https://${company}.recruitee.com/api/offers`);
    syncLogger.logRequest(result.durationMs, result.success, result.retries, result.errorClass);

    if (!result.success || !result.data || !result.data.offers) {
      companiesFailed++;
      return;
    }

    const jobs = result.data.offers;
    allJobs.push(...jobs.map(job => ({
      title: job.title,
      company: job.company_name || company,
      location: job.location || 'Unknown',
      source: 'Recruitee',
      applyUrl: job.careers_url,
      description: job.description || job.title,
      postedAt: new Date(job.published_at || new Date()),
      remote: job.remote || false,
      jobType: job.employment_type_code || 'Full-time',
    })));
  }));

  await Promise.all(promises);

  return { jobs: allJobs, companiesScanned: companies.length, companiesFailed };
};

module.exports = { fetchJobs };
