const axios = require('axios');
const logger = require('../config/logger');

const fetchJobs = async () => {
  try {
    let allJobs = [];
    let page = 1;
    let pageCount = 1;
    
    while (page <= pageCount) {
      const response = await axios.get('https://www.themuse.com/api/public/jobs', {
        params: {
          page,
          category: ['Software Engineer', 'Data Science', 'IT'],
          descending: true
        }
      });

      if (page === 1) {
        pageCount = response.data.page_count || 1;
      }

      const items = response.data.results || [];

      const parsedJobs = items.map((job) => {
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
          jobType: 'Full-time', // The Muse mostly lists full-time roles in this API
          experienceLevel: experienceLevel
        };
      });

      allJobs = [...allJobs, ...parsedJobs];
      page++;
      
      // Safety limit to avoid infinite loop or very long sync
      if (page > 50) break;
    }

    logger.info(`[TheMuse] Pages Processed: ${page - 1}, Jobs Collected: ${allJobs.length}`);
    return allJobs;
  } catch (error) {
    logger.error('Error fetching jobs from TheMuse', error.message);
    return [];
  }
};

module.exports = { fetchJobs };
