const crypto = require('crypto');

/**
 * Generates a deterministic, stable SHA-256 hash for a job posting.
 * Normalizes company, title, location, employment type, ATS source, stripped URL, and sanitized description.
 */
exports.generateJobHash = (job = {}) => {
  const company = (job.company || '').toString().trim().toLowerCase();
  const title = (job.title || '').toString().trim().toLowerCase();
  const location = (job.location || '').toString().trim().toLowerCase();
  const jobType = (job.jobType || '').toString().trim().toLowerCase();
  const source = (job.source || '').toString().trim().toLowerCase();
  
  let url = (job.applyUrl || '').toString().trim().toLowerCase();
  try {
    const parsed = new URL(url);
    // Strip trailing slash, query parameters, and fragments
    url = (parsed.hostname + parsed.pathname).replace(/\/+$/, '');
  } catch (e) {
    url = url.split('?')[0].split('#')[0].replace(/\/+$/, '');
  }
  
  // Normalize whitespace in description before hashing
  const normalizedDesc = (job.description || '').toString().replace(/\s+/g, ' ').trim().toLowerCase();
  const descHash = crypto.createHash('md5').update(normalizedDesc).digest('hex');

  const canonicalString = `${company}|${title}|${location}|${jobType}|${source}|${url}|${descHash}`;
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
};
