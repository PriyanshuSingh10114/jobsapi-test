const { fetchWithRetry } = require('../core/httpClient');
const pLimit = require('../utils/concurrency');
const path = require('path');
const fs = require('fs');

const fetchJobs = async (syncLogger) => {
  const configPath = path.join(__dirname, '../config/connectors/workday.json');
  let companies = [];
  try {
    companies = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to load config: ${err.message}`);
  }

  let allJobs = [];
  let companiesFailed = 0;
  const limit = pLimit(5);

  const promises = companies.map(companyObj => limit(async () => {
    // Workday needs POST request
    const result = await fetchWithRetry(companyObj.url, {
      method: 'POST',
      data: {
        appliedFacets: {},
        limit: 20,
        offset: 0,
        searchText: ""
      },
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
    
    syncLogger.logRequest(result.durationMs, result.success, result.retries, result.errorClass);

    if (!result.success || !result.data || !result.data.jobPostings) {
      companiesFailed++;
      return;
    }

    const jobs = result.data.jobPostings;
    if (jobs.length === 0) return;

    allJobs.push(...jobs.map(job => {
      const baseUrl = companyObj.url.split('/wday')[0];
      const jobUrlPath = job.externalPath || '';
      
      return {
        title: job.title || '',
        company: companyObj.name,
        location: job.locationsText || 'Unknown',
        source: 'Workday',
        applyUrl: `${baseUrl}/en-US${companyObj.url.split('cxs')[1].replace('/jobs', '')}${jobUrlPath}`,
        description: job.title || '',
        postedAt: job.postedOn ? new Date() : new Date(),
        remote: job.locationsText?.toLowerCase().includes('remote') || false,
        jobType: job.timeType || ''
      };
    }));
  }));

  await Promise.all(promises);

  return { jobs: allJobs, companiesScanned: companies.length, companiesFailed };
};

module.exports = { fetchJobs };
