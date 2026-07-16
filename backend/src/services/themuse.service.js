const { fetchWithRetry } = require('../core/httpClient');
const pLimit = require('../utils/concurrency');

const fetchJobs = async (syncLogger) => {
  let allJobs = [];
  
  const initialResult = await fetchWithRetry('https://www.themuse.com/api/public/jobs', {
    params: { page: 1, category: ['Software Engineer', 'Data Science', 'IT'], descending: true }
  });

  syncLogger.logRequest(initialResult.durationMs, initialResult.success, initialResult.retries, initialResult.errorClass);

  if (!initialResult.success || !initialResult.data) {
    throw new Error(`TheMuse API Error: ${initialResult.error || 'Invalid response'}`);
  }

  const pageCount = initialResult.data.page_count || 1;
  const items = initialResult.data.results || [];
  
  const parseJobs = (results) => {
    return results.map((job) => {
      const locations = job.locations.map(loc => loc.name).join(', ');
      const isRemote = locations.toLowerCase().includes('flexible') || locations.toLowerCase().includes('remote');
      let experienceLevel = 'Entry/Mid Level';
      if (job.levels && job.levels.length > 0) {
        experienceLevel = job.levels.map(l => l.name).join(', ');
      }
      return {
        title: job.name,
        company: job.company.name,
        location: locations || 'Unknown',
        source: 'TheMuse',
        applyUrl: job.refs.landing_page,
        description: job.contents || 'No description provided.',
        postedAt: new Date(job.publication_date),
        remote: isRemote,
        jobType: 'Full-time',
        experienceLevel: experienceLevel
      };
    });
  };

  allJobs.push(...parseJobs(items));

  const totalPagesToFetch = Math.min(pageCount, 50); // limit to 50
  const limit = pLimit(10);
  const promises = [];

  for (let page = 2; page <= totalPagesToFetch; page++) {
    promises.push(limit(async () => {
      const res = await fetchWithRetry('https://www.themuse.com/api/public/jobs', {
        params: { page, category: ['Software Engineer', 'Data Science', 'IT'], descending: true }
      });
      syncLogger.logRequest(res.durationMs, res.success, res.retries, res.errorClass);
      
      if (res.success && res.data && res.data.results) {
        allJobs.push(...parseJobs(res.data.results));
      }
    }));
  }

  await Promise.all(promises);

  return { jobs: allJobs, companiesScanned: 1, companiesFailed: 0 };
};

module.exports = { fetchJobs };
