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

const fullStateNames = usStatesAndAbbreviations.filter(s => s.length > 2).map(s => s.toLowerCase());

const isUSLocation = (locationString) => {
  if (!locationString) return false;
  
  const loc = locationString.toLowerCase();
  
  // Use strict word boundary regex for "US" and "USA" to prevent matching "A-US-tralia" or "Cypr-US"
  const usRegex = /\b(us|usa|united states|america|united states of america)\b/i;
  
  if (usRegex.test(loc)) {
    return true;
  }

  // Match explicit state names
  if (fullStateNames.some(state => loc.includes(state))) {
    return true;
  }

  // To safely match abbreviations like HI, IN, OR, we must enforce strict boundaries.
  // We require them to be at the end of the string or preceded by a comma.
  const abbrRegex = /\b(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/;
  
  // Match "City, ST" format specifically to avoid random words in string
  if (/[a-z]+,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i.test(locationString)) {
    return true;
  }
  
  // If the location matches "US, CA, Santa Clara" (Workday standard)
  if (/\bus,\s*[a-z]{2}\b/i.test(locationString) || /\busa?-/i.test(locationString)) {
    return true;
  }

  return false;
};

const classifyJobRegion = (locationString, isRemote, titleString = '') => {
  const title = titleString.toLowerCase();
  const loc = (locationString || '').toLowerCase();
  const isHybrid = title.includes('hybrid') || loc.includes('hybrid');

  if (isRemote) return 'Remote';
  if (isHybrid) return 'Hybrid';
  return 'Onsite';
};

const getCountry = (locationString) => {
  if (!locationString) return 'Unknown';
  const loc = locationString.toLowerCase();
  
  // Normalize US variants
  if (loc === 'us' || loc === 'usa' || loc === 'remote usa' || loc === 'remote us' || loc === 'united states' || loc === 'united states of america' || isUSLocation(locationString)) {
    return 'United States';
  }
  
  // Attempt simple extraction or default
  const parts = locationString.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return 'International';
};

const normalizeLocation = (locationString) => {
  if (!locationString) return 'Unknown';
  const loc = locationString.toLowerCase().trim();
  if (loc === 'us' || loc === 'usa' || loc === 'united states' || loc === 'united states of america' || loc === 'remote usa' || loc === 'remote us') {
    return 'United States';
  }
  return locationString.trim();
};

const isAllowedForUSPlatform = (locationString, isRemote, titleString = '') => {
  const loc = (locationString || '').toLowerCase();
  
  // Explicitly allow global remote roles
  if (loc.includes('worldwide') || loc.includes('global') || loc.includes('anywhere')) {
    return true;
  }
  
  const region = classifyJobRegion(locationString, isRemote, titleString);
  
  // Reject 'Unknown' (safety catch)
  const allowedRegions = ['Onsite', 'Hybrid', 'Remote'];
  return allowedRegions.includes(region);
};

module.exports = { isAllowedForUSPlatform, isUSLocation, classifyJobRegion, getCountry, normalizeLocation };
