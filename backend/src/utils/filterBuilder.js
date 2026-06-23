const { getRoleRegexPattern } = require('./roleNormalizer');

/**
 * Builds a standardized MongoDB filter object for jobs.
 * This guarantees that /api/stats and /api/jobs/search always return consistent counts.
 * @param {Object} queryParams - The req.query object.
 * @returns {Object} MongoDB query filter object.
 */
const buildJobFilter = (queryParams = {}) => {
  const { role, location, company, jobType, experienceLevel, remote, source, datePosted, jobRegion, skills } = queryParams;
  
  const query = {};
  const andConditions = [];

  // 1. Job Region Filtering
  if (jobRegion && jobRegion !== 'All Jobs') {
    if (jobRegion === 'US Jobs') {
      andConditions.push({ jobRegion: { $in: ['US Onsite', 'US Hybrid', 'US Remote'] } });
    } else {
      andConditions.push({ jobRegion });
    }
  }

  // 2. Search for Role and Skills (Regex instead of $text)
  if (role || skills) {
    const searchConditions = [];
    if (role) {
      const pattern = getRoleRegexPattern(role);
      searchConditions.push(
        { title: { $regex: pattern, $options: 'i' } },
        { description: { $regex: pattern, $options: 'i' } }
      );
    }
    if (skills) {
      // Just basic regex for skills if no role
      searchConditions.push({ description: { $regex: skills, $options: 'i' } });
      searchConditions.push({ skills: { $regex: skills, $options: 'i' } });
    }
    andConditions.push({ $or: searchConditions });
  }

  // 3. String Filters
  if (company) {
    andConditions.push({ company: { $regex: new RegExp(company, 'i') } });
  }
  if (location) {
    andConditions.push({ location: { $regex: new RegExp(location, 'i') } });
  }
  if (jobType) {
    const parsedJobType = jobType.replace(/-/g, ' ');
    andConditions.push({
      $or: [
        { jobType: { $regex: new RegExp(parsedJobType, 'i') } },
        { title: { $regex: new RegExp(parsedJobType, 'i') } }
      ]
    });
  }
  if (experienceLevel) {
    andConditions.push({ experienceLevel: { $regex: new RegExp(experienceLevel, 'i') } });
  }

  // 4. Exact Matches
  if (remote === 'true') {
    andConditions.push({ remote: true });
  }
  if (source) {
    andConditions.push({ source: { $regex: new RegExp(`^${source}$`, 'i') } });
  }

  // 5. Global 30-Day Expiration Filter
  const date = new Date();
  if (datePosted === 'Past 24 hours') {
    date.setDate(date.getDate() - 1);
  } else if (datePosted === 'Past Week') {
    date.setDate(date.getDate() - 7);
  } else {
    // Default strict 30-day cutoff for everything else (including "Past Month" or empty)
    date.setDate(date.getDate() - 30);
  }
  andConditions.push({ postedAt: { $gte: date } });

  // 6. Global US-First Business Rule (Phase 2 Enforcement)
  andConditions.push({
    $or: [
      { isUSJob: true },
      { remote: true }
    ]
  });

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  return query;
};

module.exports = { buildJobFilter };
