const { fetchWithRetry } = require('../core/httpClient');

const fetchJobs = async (syncLogger) => {
  const apiKey = process.env.USAJOBS_API_KEY;
  const userEmail = process.env.USAJOBS_EMAIL || 'admin@example.com';

  if (!apiKey) {
    throw new Error('USAJOBS_API_KEY is missing. Registration required at developer.usajobs.gov');
  }

  const result = await fetchWithRetry('https://data.usajobs.gov/api/search', {
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

  syncLogger.logRequest(result.durationMs, result.success, result.retries, result.errorClass);

  if (!result.success || !result.data || !result.data.SearchResult) {
    throw new Error(`USAJobs API Error: ${result.error || 'Invalid response'}`);
  }

  const items = result.data.SearchResult.SearchResultItems || [];

  const formattedJobs = items.map((item) => {
    const details = item.MatchedObjectDescriptor;
    const location = details.PositionLocation && details.PositionLocation.length > 0 
      ? details.PositionLocation[0].LocationName 
      : 'Unknown';

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

  return { jobs: formattedJobs, companiesScanned: 1, companiesFailed: 0 };
};

module.exports = { fetchJobs };
