const { fetchWithRetry } = require('../core/httpClient');
const { normalizeJobType } = require('../utils/jobTypeNormalizer');

const fetchJobs = async (syncLogger) => {
  const result = await fetchWithRetry('https://arbeitnow.com/api/job-board-api');
  syncLogger.logRequest(result.durationMs, result.success, result.retries, result.errorClass);

  if (!result.success || !result.data || !result.data.data) {
    throw new Error(`Arbeitnow API Error: ${result.error || 'Invalid response'}`);
  }

  const jobs = result.data.data;
  
  const formattedJobs = jobs.map(job => ({
    title: job.title,
    company: job.company_name,
    location: job.location,
    source: 'Arbeitnow',
    applyUrl: job.url,
    description: job.description,
    postedAt: job.created_at ? new Date(job.created_at * 1000) : new Date(),
    remote: job.remote,
    jobType: normalizeJobType(job.job_types?.join(', ') || '', job.title),
  }));

  return { jobs: formattedJobs, companiesScanned: 1, companiesFailed: 0 };
};

module.exports = { fetchJobs };
