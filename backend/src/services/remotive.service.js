const { fetchWithRetry } = require('../core/httpClient');
const { normalizeJobType } = require('../utils/jobTypeNormalizer');

const fetchJobs = async (syncLogger) => {
  const result = await fetchWithRetry('https://remotive.com/api/remote-jobs');
  syncLogger.logRequest(result.durationMs, result.success, result.retries, result.errorClass);

  if (!result.success || !result.data || !result.data.jobs) {
    throw new Error(`Remotive API Error: ${result.error || 'Invalid response'}`);
  }

  const jobs = result.data.jobs;
  
  const formattedJobs = jobs.map(job => ({
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location,
    source: 'Remotive',
    applyUrl: job.url,
    description: job.description,
    postedAt: new Date(job.publication_date),
    remote: true,
    jobType: normalizeJobType(job.job_type || '', job.title),
  }));

  return { jobs: formattedJobs, companiesScanned: 1, companiesFailed: 0 };
};

module.exports = { fetchJobs };
