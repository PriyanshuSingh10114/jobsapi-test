const crypto = require('crypto');

exports.generateJobHash = (job) => {
  const company = job.company || '';
  const title = job.title || '';
  const location = job.location || '';
  const jobType = job.jobType || '';
  const source = job.source || '';
  
  let url = job.applyUrl || '';
  try {
    const parsed = new URL(url);
    url = parsed.hostname + parsed.pathname;
  } catch (e) {
    url = url.split('?')[0];
  }
  
  const descHash = crypto.createHash('md5').update(job.description || '').digest('hex');

  const str = `${company}|${title}|${location}|${jobType}|${source}|${url}|${descHash}`.toLowerCase().trim();
  return crypto.createHash('sha256').update(str).digest('hex');
};
