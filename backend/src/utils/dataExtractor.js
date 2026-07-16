const usStatesAndAbbreviations = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
  'AL': 'AL', 'AK': 'AK', 'AZ': 'AZ', 'AR': 'AR', 'CA': 'CA', 'CO': 'CO', 'CT': 'CT', 'DE': 'DE',
  'FL': 'FL', 'GA': 'GA', 'HI': 'HI', 'ID': 'ID', 'IL': 'IL', 'IN': 'IN', 'IA': 'IA', 'KS': 'KS',
  'KY': 'KY', 'LA': 'LA', 'ME': 'ME', 'MD': 'MD', 'MA': 'MA', 'MI': 'MI', 'MN': 'MN', 'MS': 'MS',
  'MO': 'MO', 'MT': 'MT', 'NE': 'NE', 'NV': 'NV', 'NH': 'NH', 'NJ': 'NJ', 'NM': 'NM', 'NY': 'NY',
  'NC': 'NC', 'ND': 'ND', 'OH': 'OH', 'OK': 'OK', 'OR': 'OR', 'PA': 'PA', 'RI': 'RI', 'SC': 'SC',
  'SD': 'SD', 'TN': 'TN', 'TX': 'TX', 'UT': 'UT', 'VT': 'VT', 'VA': 'VA', 'WA': 'WA', 'WV': 'WV',
  'WI': 'WI', 'WY': 'WY'
};

const COMMON_SKILLS = [
  'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'Kubernetes', 'SQL', 
  'Machine Learning', 'TypeScript', 'Angular', 'Vue', 'C++', 'C#', 'Go', 
  'Ruby', 'PHP', 'Azure', 'GCP', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'GraphQL', 'Spring Boot', 'Django', 'Flask', 'TensorFlow', 'PyTorch', 'Spark',
  'Hadoop', 'Kafka', 'Terraform', 'Ansible', 'Jenkins', 'CI/CD', 'Linux',
  'Agile', 'Scrum', 'Product Management', 'Data Analysis', 'Tableau', 'Power BI'
];

const PRECOMPILED_SKILLS = COMMON_SKILLS.map(skill => {
  const isSpecial = skill.includes('+') || skill.includes('.');
  return {
    skill,
    isSpecial,
    lowerSkill: skill.toLowerCase(),
    regex: isSpecial ? null : new RegExp(`\\b${skill}\\b`, 'i')
  };
});

const extractState = (locationString) => {
  if (!locationString) return null;
  const loc = locationString.replace(/,/g, ' ');
  const words = loc.split(/\s+/);
  
  for (const word of words) {
    const cleanWord = word.trim();
    if (usStatesAndAbbreviations[cleanWord]) {
      return usStatesAndAbbreviations[cleanWord];
    }
  }
  return null;
};

const extractSkills = (text) => {
  if (!text) return [];
  const foundSkills = [];
  const lowerText = text.toLowerCase();
  
  for (const { skill, isSpecial, lowerSkill, regex } of PRECOMPILED_SKILLS) {
    if (isSpecial) {
      if (lowerText.includes(lowerSkill)) {
        foundSkills.push(skill);
      }
    } else {
      if (regex.test(lowerText)) {
        foundSkills.push(skill);
      }
    }
  }
  return foundSkills;
};

const extractSalary = (text) => {
  if (!text) return null;
  // Look for patterns like $100k, $100,000, 100k-150k
  const matches = text.match(/\$[0-9]{2,3}(?:,[0-9]{3}|k)\s*(?:-|to|and)\s*\$[0-9]{2,3}(?:,[0-9]{3}|k)/gi);
  if (matches && matches.length > 0) {
    const match = matches[0];
    const numbers = match.match(/[0-9]{2,3}(?:,[0-9]{3}|k)?/gi);
    if (numbers && numbers.length === 2) {
      const parseNum = (str) => {
        let n = parseInt(str.replace(/,/g, '').replace(/k/i, '000'), 10);
        if (str.toLowerCase().includes('k')) n = parseInt(str.replace(/k/i, ''), 10) * 1000;
        return n;
      };
      const min = parseNum(numbers[0]);
      const max = parseNum(numbers[1]);
      return { min, max, average: (min + max) / 2 };
    }
  }
  
  // Single salary
  const singleMatch = text.match(/\$[0-9]{2,3}(?:,[0-9]{3}|k)/i);
  if (singleMatch) {
    const parseNum = (str) => {
      let n = parseInt(str.replace(/\$/g, '').replace(/,/g, '').replace(/k/i, '000'), 10);
      if (str.toLowerCase().includes('k')) n = parseInt(str.replace(/\$/g, '').replace(/k/i, ''), 10) * 1000;
      return n;
    };
    const val = parseNum(singleMatch[0]);
    if (val > 20000 && val < 1000000) {
      return { min: val, max: val, average: val };
    }
  }
  
  return null;
};

const extractExperienceLevel = (title, description, rawLevel) => {
  const t = (title || '').toLowerCase();
  
  // Explicit aggressive internship matching
  const internRegex = /\b(intern|internship|summer intern|swe intern|software engineer intern|ml intern|data science intern|security intern|co-op|apprentice)\b/i;
  if (internRegex.test(t)) return 'Internship';
  
  if (t.includes('new grad') || t.includes('graduate program') || t.includes('associate program') || /\bnew graduate\b/.test(t)) return 'New Grad';
  if (t.includes('entry level') || t.includes('junior') || t.includes(' jr ') || t.match(/\bjr\b/)) return 'Entry Level';
  if (t.includes('senior') || t.includes(' sr ') || t.match(/\bsr\b/) || t.includes('staff') || t.includes('principal') || t.includes('architect')) return 'Senior';
  if (t.includes('lead') || t.includes('manager') || t.includes('director') || t.match(/\bvp\b/) || t.includes('head') || t.includes('chief')) return 'Leadership';
  if (t.includes('mid level') || t.match(/\bii\b/) || t.match(/\biii\b/)) return 'Mid Level';

  if (rawLevel) {
    const rl = rawLevel.toLowerCase();
    if (rl.includes('intern') || rl.includes('co-op') || rl.includes('graduate')) return 'Internship';
    if (rl.includes('new grad')) return 'New Grad';
    if (rl.includes('entry') || rl.includes('junior')) return 'Entry Level';
    if (rl.includes('senior') || rl.includes('staff') || rl.includes('principal') || rl.includes('architect')) return 'Senior';
    if (rl.includes('lead') || rl.includes('manager') || rl.includes('director') || rl.includes('executive')) return 'Leadership';
    if (rl.includes('mid')) return 'Mid Level';
  }

  return 'Entry Level'; // Safe fallback instead of Unknown
};

const extractEmploymentType = (title, description, rawType) => {
  const t = (title || '').toLowerCase();
  
  const internRegex = /\b(intern|internship|summer intern|swe intern|software engineer intern|ml intern|data science intern|security intern|co-op|apprentice)\b/i;
  if (internRegex.test(t)) return 'Internship';
  
  if (t.includes('contract') || t.includes('freelance')) return 'Contract';
  if (t.includes('part time') || t.includes('part-time')) return 'Part Time';
  if (t.includes('temporary')) return 'Temporary';
  if (t.includes('full time') || t.includes('full-time') || t.includes('new grad') || t.includes('graduate program') || t.includes('associate program')) return 'Full Time';
  
  if (rawType) {
    const rt = rawType.toLowerCase();
    if (rt.includes('intern') || rt.includes('co-op') || rt.includes('apprentice')) return 'Internship';
    if (rt.includes('contract') || rt.includes('freelance')) return 'Contract';
    if (rt.includes('part')) return 'Part Time';
    if (rt.includes('temp')) return 'Temporary';
    if (rt.includes('full')) return 'Full Time';
  }

  return 'Full Time'; // Safe fallback instead of Unknown
};

module.exports = {
  extractState,
  extractSkills,
  extractSalary,
  extractExperienceLevel,
  extractEmploymentType
};
