const axios = require('axios');
const logger = require('../config/logger');

const fetchJobs = async () => {
  const apiKey = process.env.USAJOBS_API_KEY;
  const userEmail = process.env.USAJOBS_EMAIL || 'admin@example.com';

  if (!apiKey) {
    logger.warn('USAJOBS_API_KEY is not set. Skipping USAJobs sync.');
    return [];
  }

  try {
    const response = await axios.get('https://data.usajobs.gov/api/search', {
      params: {
        Keyword: 'Software IT Technology Data',
        ResultsPerPage: 100
      },
      headers: {
        'Host': 'data.usajobs.gov',
        'User-Agent': userEmail,
        'Authorization-Key': apiKey
      }
    });

    const items = response.data.SearchResult.SearchResultItems || [];

    return items.map((item) => {
      const details = item.MatchedObjectDescriptor;
      const location = details.PositionLocation && details.PositionLocation.length > 0 
        ? details.PositionLocation[0].LocationName 
        : 'Unknown';

      // USAJobs locations like "Washington, District of Columbia" or "Multiple Locations"
      // Determine if remote based on position title or location
      const isRemote = details.PositionTitle.toLowerCase().includes('remote') || location.toLowerCase().includes('remote') || details.TeleworkEligible === true;

      return {
        title: details.PositionTitle,
        company: details.OrganizationName || 'US Federal Government',
        location: location,
        source: 'USAJobs',
        applyUrl: details.PositionURI,
        description: details.UserArea?.Details?.JobSummary || 'No description provided.',
        postedAt: new Date(details.PublicationStartDate),
        remote: isRemote,
        jobType: details.PositionSchedule && details.PositionSchedule.length > 0 ? details.PositionSchedule[0].Name : 'Full-time',
        experienceLevel: 'Various'
      };
    });
  } catch (error) {
    logger.error('Error fetching jobs from USAJobs', error.message);
    return [];
  }
};

module.exports = { fetchJobs };
