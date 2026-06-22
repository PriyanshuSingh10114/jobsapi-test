const crypto = require('crypto');

exports.generateJobHash = (company, title, location, source) => {
  const str = `${company || ''}|${title || ''}|${location || ''}|${source || ''}`.toLowerCase().trim();
  return crypto.createHash('sha256').update(str).digest('hex');
};
