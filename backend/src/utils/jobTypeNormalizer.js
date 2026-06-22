const normalizeJobType = (rawType, title = '') => {
  const combinedStr = `${rawType || ''} ${title || ''}`.toLowerCase();
  
  if (combinedStr.includes('full time') || combinedStr.includes('full-time') || combinedStr.includes('fulltime') || combinedStr.includes('full_time')) return 'Full Time';
  if (combinedStr.includes('part time') || combinedStr.includes('part-time') || combinedStr.includes('parttime') || combinedStr.includes('part_time')) return 'Part Time';
  if (combinedStr.includes('intern') || combinedStr.includes('internship')) return 'Internship';
  if (combinedStr.includes('contract') || combinedStr.includes('contractor')) return 'Contract';
  if (combinedStr.includes('temp') || combinedStr.includes('temporary')) return 'Temporary';
  if (combinedStr.includes('freelance')) return 'Freelance';
  
  return 'Unknown';
};

module.exports = { normalizeJobType };
