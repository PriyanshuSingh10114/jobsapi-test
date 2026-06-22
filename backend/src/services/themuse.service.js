const axios = require('axios');
const logger = require('../config/logger');

const fetchJobs = async () => {
  try {
    // The Muse API gives 20 jobs per page. We will fetch 3 pages to get 60 jobs.
    let allJobs = [];
    
    for (let page = 1; page <= 3; page++) {
      const response = await axios.get('https://www.themuse.com/api/public/jobs', {
        params: {
          page,
          category: ['Software Engineer', 'Data Science', 'IT'],
          descending: true
        }
      });

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
    }

    return allJobs;
  } catch (error) {
    logger.error('Error fetching jobs from TheMuse', error.message);
    return [];
  }
};

module.exports = { fetchJobs };
