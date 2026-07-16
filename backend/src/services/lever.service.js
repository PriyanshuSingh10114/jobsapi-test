const { fetchWithRetry } = require('../core/httpClient');
const pLimit = require('../utils/concurrency');
const { normalizeJobType } = require('../utils/jobTypeNormalizer');
const path = require('path');
const fs = require('fs');

const fetchJobs = async (syncLogger) => {
  const configPath = path.join(__dirname, '../config/connectors/lever.json');
  let leverCompanies = [];
  try {
    leverCompanies = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to load config: ${err.message}`);
  }

  let allJobs = [];
  let companiesFailed = 0;

  for (const company of leverCompanies) {
    const companyToken = company.trim();
    
    const result = await fetchWithRetry(`https://api.lever.co/v0/postings/${companyToken}?mode=json`);
    syncLogger.logRequest(result.durationMs, result.success, result.retries, result.errorClass);

    if (!result.success || !Array.isArray(result.data)) {
      companiesFailed++;
      continue;
    }

    const rawJobs = result.data;
    if (rawJobs.length === 0) continue;

    const companyJobs = rawJobs.map(job => ({
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

    allJobs.push(...companyJobs);
  }

  return { jobs: allJobs, companiesScanned: leverCompanies.length, companiesFailed };
};

module.exports = { fetchJobs };
