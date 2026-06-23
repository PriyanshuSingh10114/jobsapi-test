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
  
  const lower = searchStr.toLowerCase().trim();
  
  for (const [key, aliases] of Object.entries(roleFamilies)) {
    if (key === lower || aliases.some(alias => lower.includes(alias))) {
      // If a family is matched, return all aliases combined as a regex OR statement
      return aliases.map(a => a.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
    }
  }

  // If no family matched, just escape and return the search string itself
  return searchStr.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

module.exports = {
  roleFamilies,
  getRoleRegexPattern
};
