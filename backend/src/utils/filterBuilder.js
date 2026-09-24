const { getRoleRegexPattern } = require('./roleNormalizer');
const { escapeRegex } = require('./sanitizer');
const config = require('../config');

/**
 * Builds a standardized, sanitized MongoDB filter object for jobs.
 * Prevents ReDoS attacks and ensures consistent querying across stats and search endpoints.
 * @param {Object} queryParams - The req.query object.
 * @returns {Object} MongoDB query filter object.
 */
const buildJobFilter = (queryParams = {}) => {
  const { role, location, company, jobType, experienceLevel, remote, source, datePosted, jobRegion, skills } = queryParams;
  
  const query = {};
  const andConditions = [];

  // 1. Job Region Filtering
  if (jobRegion && jobRegion !== 'All Jobs' && jobRegion !== 'All') {
    if (jobRegion === 'US Jobs') {
      andConditions.push({ jobRegion: { $in: ['US Onsite', 'US Hybrid', 'US Remote', 'Onsite', 'Hybrid', 'Remote'] } });
    } else {
      andConditions.push({ jobRegion: String(jobRegion) });
    }
  }

  // 2. Search for Role and Skills
  if (role || skills) {
    const searchConditions = [];
    if (role) {
      const pattern = getRoleRegexPattern(String(role));
      searchConditions.push(
        { title: { $regex: pattern, $options: 'i' } },
        { description: { $regex: pattern, $options: 'i' } }
      );
    }
    if (skills) {
      const escapedSkills = escapeRegex(String(skills).trim());
      searchConditions.push({ description: { $regex: escapedSkills, $options: 'i' } });
      searchConditions.push({ skills: { $regex: escapedSkills, $options: 'i' } });
    }
    andConditions.push({ $or: searchConditions });
  }

  // 3. Sanitized String Filters
  if (company) {
    const escapedCompany = escapeRegex(String(company).trim());
    andConditions.push({ company: { $regex: new RegExp(escapedCompany, 'i') } });
  }
  if (location) {
    const escapedLocation = escapeRegex(String(location).trim());
    andConditions.push({ location: { $regex: new RegExp(escapedLocation, 'i') } });
  }
  if (jobType && jobType !== 'All' && jobType !== 'Any Type') {
    const parsedJobType = escapeRegex(String(jobType).replace(/-/g, ' ').trim());
    andConditions.push({
      $or: [
        { jobType: { $regex: new RegExp(parsedJobType, 'i') } },
        { title: { $regex: new RegExp(parsedJobType, 'i') } }
      ]
    });
  }
  if (experienceLevel && experienceLevel !== 'All') {
    const escapedLevel = escapeRegex(String(experienceLevel).trim());
    andConditions.push({ experienceLevel: { $regex: new RegExp(escapedLevel, 'i') } });
  }

  // 4. Exact Matches
  if (remote === 'true' || remote === true) {
    andConditions.push({ remote: true });
  }
  if (source && source !== 'All') {
    const escapedSource = escapeRegex(String(source).trim());
    andConditions.push({ source: { $regex: new RegExp(`^${escapedSource}$`, 'i') } });
  }

  // 5. Date Posted Filter (Applied only when user explicitly filters by date)
  if (datePosted && datePosted !== 'All' && datePosted !== 'All Time') {
    const date = new Date();
    if (datePosted === 'Past 24 hours') {
      date.setDate(date.getDate() - 1);
      andConditions.push({ postedAt: { $gte: date } });
    } else if (datePosted === 'Past Week') {
      date.setDate(date.getDate() - 7);
      andConditions.push({ postedAt: { $gte: date } });
    } else if (datePosted === 'Past Month') {
      date.setDate(date.getDate() - 30);
      andConditions.push({ postedAt: { $gte: date } });
    }
  }

  // 6. Global US-First Business Rule (Permits active US jobs)
  if (config.strictUSMode !== false) {
    andConditions.push({
      $or: [
        { isUSJob: true },
        { country: 'United States' },
        { isUSJob: { $exists: false } }
      ]
    });
  }

  // 7. Active jobs filter
  andConditions.push({ is_active: { $ne: false } });

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  return query;
};

module.exports = { buildJobFilter };
