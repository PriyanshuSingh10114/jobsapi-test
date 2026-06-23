const roleFamilies = {
  'frontend': ['frontend', 'front end', 'react', 'ui engineer', 'vue', 'angular'],
  'backend': ['backend', 'back end', 'api engineer', 'node', 'java', 'golang', 'python developer'],
  'fullstack': ['full stack', 'fullstack', 'full-stack', 'software engineer', 'software developer'],
  'data': ['data scientist', 'machine learning', 'ml engineer', 'data engineer', 'ai engineer'],
  'product': ['product manager', 'pm', 'product owner'],
  'design': ['designer', 'ui/ux', 'ux/ui', 'product designer'],
  'devops': ['devops', 'sre', 'site reliability', 'platform engineer'],
  'security': ['security', 'infosec', 'penetration', 'cybersecurity']
};

/**
 * Normalizes a user search query into a RegEx pattern matching the entire role family.
 * @param {string} searchStr 
 * @returns {string} regex pattern string
 */
const getRoleRegexPattern = (searchStr) => {
  if (!searchStr) return '';
  
  const cleanSearch = searchStr.replace(/[^\w\s-]/gi, '').trim().replace(/\s+/g, ' ');
  const lower = cleanSearch.toLowerCase();
  if (!lower) return '';
  
  let matchedAliases = new Set();
  
  for (const [key, aliases] of Object.entries(roleFamilies)) {
    if (key === lower || lower.includes(key) || aliases.some(alias => lower.includes(alias))) {
      matchedAliases.add(key);
      aliases.forEach(a => matchedAliases.add(a));
    }
  }

  if (matchedAliases.size === 0) {
    matchedAliases.add(lower);
    const words = lower.split(' ');
    if (words.length > 1) {
      words.forEach(w => { if (w.length > 2) matchedAliases.add(w); });
    }
  }

  const escapeRegEx = (str) => str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const patterns = Array.from(matchedAliases).map(escapeRegEx);
  
  return patterns.join('|');
};

module.exports = {
  roleFamilies,
  getRoleRegexPattern
};
