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

  // 2. Text Search for Role and Skills
  let textSearchStr = '';
  if (role) textSearchStr += role + ' ';
  if (skills) textSearchStr += skills;
  if (textSearchStr.trim()) {
    query.$text = { $search: textSearchStr.trim() };
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

  // 5. Date Filters
  if (datePosted) {
    const date = new Date();
    if (datePosted === 'Past 24 hours') {
      date.setDate(date.getDate() - 1);
      andConditions.push({ postedAt: { $gte: date } });
    } else if (datePosted === 'Past Week') {
      date.setDate(date.getDate() - 7);
      andConditions.push({ postedAt: { $gte: date } });
    } else if (datePosted === 'Past Month') {
      date.setMonth(date.getMonth() - 1);
      andConditions.push({ postedAt: { $gte: date } });
    }
  }

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  return query;
};

module.exports = { buildJobFilter };
