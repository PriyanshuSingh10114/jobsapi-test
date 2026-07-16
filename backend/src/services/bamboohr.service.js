const { fetchWithRetry } = require('../core/httpClient');
const { XMLParser } = require('fast-xml-parser');
const pLimit = require('../utils/concurrency');
const path = require('path');
const fs = require('fs');

const fetchJobs = async (syncLogger) => {
  const configPath = path.join(__dirname, '../config/connectors/bamboohr.json');
  let companies = [];
  try {
    companies = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to load config: ${err.message}`);
  }

  let allJobs = [];
  let companiesFailed = 0;
  const limit = pLimit(10);
  const parser = new XMLParser();

  const promises = companies.map(company => limit(async () => {
    const result = await fetchWithRetry(`https://${company}.bamboohr.com/jobs/embed2.php`);
    syncLogger.logRequest(result.durationMs, result.success, result.retries, result.errorClass);

    if (!result.success || !result.data) {
      companiesFailed++;
      return;
    }

    try {
      const parsed = parser.parse(result.data);
      let rawJobs = parsed?.XML?.job || [];
      if (!Array.isArray(rawJobs)) rawJobs = [rawJobs];

      allJobs.push(...rawJobs.map(job => ({
        title: job.title || '',
        company: company.charAt(0).toUpperCase() + company.slice(1),
        location: job.location || 'Unknown',
        source: 'BambooHR',
        applyUrl: job.detailUrl || `https://${company}.bamboohr.com/jobs`,
        description: job.description || '',
        postedAt: new Date(),
        remote: false,
        jobType: job.employmentType || ''
      })));
    } catch (err) {
      syncLogger.logRequest(0, false, 0, 'Parser Error');
      companiesFailed++;
    }
  }));

  await Promise.all(promises);

  return { jobs: allJobs, companiesScanned: companies.length, companiesFailed };
};

module.exports = { fetchJobs };
