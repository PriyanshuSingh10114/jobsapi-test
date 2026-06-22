const usStatesAndAbbreviations = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
  'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas',
  'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
  'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana',
  'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const usKeywords = ['US', 'USA', 'United States', 'America', 'United States of America'];

const isUSLocation = (locationString) => {
  if (!locationString) return false;
  
  const loc = locationString.toLowerCase();
  
  // Direct matches
  if (usKeywords.some(keyword => loc.includes(keyword.toLowerCase()))) {
    return true;
  }

  // Exact word match for states (to avoid matching substrings like "INDIAN" in "Indiana")
  const words = loc.split(/[\s,]+/);
  if (words.some(word => usStatesAndAbbreviations.some(state => state.toLowerCase() === word))) {
    return true;
  }

  return false;
};

const classifyJobRegion = (locationString, isRemote, titleString = '') => {
  const isUS = isUSLocation(locationString);
  const title = titleString.toLowerCase();
  const loc = (locationString || '').toLowerCase();
  const isHybrid = title.includes('hybrid') || loc.includes('hybrid');

  if (isUS) {
    if (isRemote) return 'US Remote';
    if (isHybrid) return 'US Hybrid';
    return 'US Onsite';
  } else {
    // Non-US
    if (isRemote) return 'International Remote';
    // If it's non-US onsite or hybrid, we now keep it
    return 'Unknown'; 
  }
};

const getCountry = (locationString) => {
  if (!locationString) return 'Unknown';
  if (isUSLocation(locationString)) return 'United States';
  // Attempt simple extraction or default
  const parts = locationString.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return 'International';
};

module.exports = { isUSLocation, classifyJobRegion, getCountry };
