const config = require('../config');

const STRICT_INTERNATIONAL_BLACKLIST = [
  'london', 'toronto', 'vancouver', 'montreal', 'calgary', 'ottawa',
  'mexico city', 'guadalajara', 'monterrey', 'berlin', 'munich', 'hamburg',
  'singapore', 'sydney', 'melbourne', 'brisbane', 'perth', 'india', 'bangalore',
  'hyderabad', 'pune', 'mumbai', 'delhi', 'chennai', 'dublin', 'amsterdam',
  'paris', 'tokyo', 'uk', 'united kingdom', 'canada', 'germany', 'australia'
];

const BLACKLIST_REGEXES = STRICT_INTERNATIONAL_BLACKLIST.map(city => ({
  city,
  regex: new RegExp(`\\b${city}\\b`, 'i')
}));

/**
 * Global Compliance Validation Engine
 * Runs securely before any ATS ingestion bulkWrite attempt.
 */
const validateJob = (job) => {
  // Rule 1: Completeness
  if (!job.title) return { isValid: false, reason: 'Title' };
  if (!job.company) return { isValid: false, reason: 'Company' };
  if (!job.applyUrl) return { isValid: false, reason: 'Apply URL' };
  if (!job.location) return { isValid: false, reason: 'Location' };
  if (!job.source) return { isValid: false, reason: 'Source' };
  if (!job.jobType) return { isValid: false, reason: 'Employment Type' };
  if (!job.description || job.description.length < 10) return { isValid: false, reason: 'Description' };
  if (!job.postedAt) return { isValid: false, reason: 'Posted At' };

  // Rule 2: Valid URL
  if (!job.applyUrl.startsWith('http://') && !job.applyUrl.startsWith('https://')) {
    return { isValid: false, reason: 'Invalid or broken applyUrl protocol' };
  }

  // Rule 3: Freshness Cutoff (Respects configured retentionDays)
  const maxDays = config.retentionDays || 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxDays);
  const jobDate = new Date(job.postedAt);
  if (isNaN(jobDate) || jobDate < cutoffDate) {
    return { isValid: false, reason: `Job is older than ${maxDays} days or has invalid date` };
  }

  // Rule 4: Regional Enforcement (Only enforce strict US filtering if strictUSMode is enabled)
  if (config.strictUSMode) {
    if (!job.isUSJob && !job.remote) {
      return { isValid: false, reason: 'Reject non-US onsite/hybrid job' };
    }

    const locLower = (job.location || '').toLowerCase();
    for (const { city, regex } of BLACKLIST_REGEXES) {
      if (regex.test(locLower)) {
        return { isValid: false, reason: `STRICT_US_MODE Violation: Location matches blacklisted international hub (${city})` };
      }
    }
  }


  // Validation passed
  return { isValid: true, reason: null };
};

module.exports = { validateJob };
