const axios = require('axios');
const logger = require('../config/logger');
const pLimit = require('../utils/concurrency');

const fetchJobs = async () => {
  try {
    let allJobs = [];
    
    // Fetch page 1 first to get page_count
    const initialResponse = await axios.get('https://www.themuse.com/api/public/jobs', {
      params: { page: 1, category: ['Software Engineer', 'Data Science', 'IT'], descending: true }
    });

    const pageCount = initialResponse.data.page_count || 1;
    const items = initialResponse.data.results || [];
    
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
        try {
          const res = await axios.get('https://www.themuse.com/api/public/jobs', {
            params: { page, category: ['Software Engineer', 'Data Science', 'IT'], descending: true }
          });
          const pageItems = res.data.results || [];
          allJobs.push(...parseJobs(pageItems));
        } catch (err) {
          logger.warn(`TheMuse failed to fetch page ${page}: ${err.message}`);
        }
      }));
    }

    await Promise.all(promises);

    logger.info(`[TheMuse] Pages Processed: ${totalPagesToFetch}, Jobs Collected: ${allJobs.length}`);
    return allJobs;
  } catch (error) {
    logger.error('Error fetching jobs from TheMuse', error.message);
    return [];
  }
};

module.exports = { fetchJobs };

module.exports = { fetchJobs };
