/**
 * Canonical Field Registry
 * Defines the standardized contract between the Canonical Candidate Model
 * and ATS automation engines/adapters.
 */

const CANONICAL_FIELD_DEFINITIONS = {
  // --- IDENTITY ---
  'candidate.identity.firstName': {
    path: 'identity.firstName',
    label: 'First Name',
    type: 'string',
    required: true,
    sensitive: false,
    synonyms: [
      /\b(first\s*name|given\s*name|legal\s*first\s*name|forename|fname)\b/i,
      /^first_name$/i,
      /^firstname$/i,
      /^first$/i
    ],
    getValue: (profile) => profile?.identity?.firstName || ''
  },
  'candidate.identity.lastName': {
    path: 'identity.lastName',
    label: 'Last Name',
    type: 'string',
    required: true,
    sensitive: false,
    synonyms: [
      /\b(last\s*name|family\s*name|surname|legal\s*last\s*name|lname)\b/i,
      /^last_name$/i,
      /^lastname$/i,
      /^last$/i
    ],
    getValue: (profile) => profile?.identity?.lastName || ''
  },
  'candidate.identity.fullName': {
    path: 'identity.fullName',
    label: 'Full Name',
    type: 'string',
    required: false,
    sensitive: false,
    synonyms: [
      /\b(full\s*name|candidate\s*name|your\s*name|legal\s*name)\b/i,
      /^name$/i,
      /^fullname$/i
    ],
    getValue: (profile) => {
      const parts = [profile?.identity?.firstName, profile?.identity?.middleName, profile?.identity?.lastName].filter(Boolean);
      return parts.join(' ');
    }
  },
  'candidate.identity.preferredName': {
    path: 'identity.preferredName',
    label: 'Preferred Name',
    type: 'string',
    required: false,
    sensitive: false,
    synonyms: [
      /\b(preferred\s*name|chosen\s*name|nickname)\b/i
    ],
    getValue: (profile) => profile?.identity?.preferredName || profile?.identity?.firstName || ''
  },
  'candidate.identity.email': {
    path: 'identity.email',
    label: 'Email Address',
    type: 'string',
    required: true,
    sensitive: false,
    synonyms: [
      /\b(email\s*address|primary\s*email|e-mail|email)\b/i,
      /^email$/i,
      /^email_address$/i
    ],
    getValue: (profile) => profile?.identity?.email || ''
  },
  'candidate.identity.phone': {
    path: 'identity.phone',
    label: 'Phone Number',
    type: 'string',
    required: true,
    sensitive: false,
    synonyms: [
      /\b(phone\s*number|mobile\s*phone|cell\s*phone|telephone|contact\s*number|phone)\b/i,
      /^phone$/i,
      /^mobile$/i
    ],
    getValue: (profile) => profile?.identity?.phone || ''
  },

  // --- LOCATION ---
  'candidate.location.addressLine1': {
    path: 'location.addressLine1',
    label: 'Street Address',
    type: 'string',
    required: false,
    sensitive: false,
    synonyms: [
      /\b(street\s*address|address\s*line\s*1|address)\b/i,
      /^address$/i
    ],
    getValue: (profile) => profile?.location?.addressLine1 || ''
  },
  'candidate.location.city': {
    path: 'location.city',
    label: 'City',
    type: 'string',
    required: true,
    sensitive: false,
    synonyms: [
      /\b(city|town|municipality)\b/i,
      /^city$/i
    ],
    getValue: (profile) => profile?.location?.city || ''
  },
  'candidate.location.state': {
    path: 'location.state',
    label: 'State / Province',
    type: 'string',
    required: true,
    sensitive: false,
    synonyms: [
      /\b(state|province|region)\b/i,
      /^state$/i,
      /^province$/i
    ],
    getValue: (profile) => profile?.location?.state || ''
  },
  'candidate.location.postalCode': {
    path: 'location.postalCode',
    label: 'Postal / Zip Code',
    type: 'string',
    required: true,
    sensitive: false,
    synonyms: [
      /\b(zip\s*code|postal\s*code|zip|postcode)\b/i,
      /^zip$/i,
      /^postal_code$/i
    ],
    getValue: (profile) => profile?.location?.postalCode || ''
  },
  'candidate.location.country': {
    path: 'location.country',
    label: 'Country',
    type: 'string',
    required: true,
    sensitive: false,
    synonyms: [
      /\b(country|nation|residence\s*country)\b/i,
      /^country$/i
    ],
    getValue: (profile) => profile?.location?.country || 'United States'
  },

  // --- CONTACT & ONLINE PRESENCE ---
  'candidate.contact.linkedinUrl': {
    path: 'contact.linkedinUrl',
    label: 'LinkedIn Profile URL',
    type: 'url',
    required: false,
    sensitive: false,
    synonyms: [
      /\b(linkedin|linkedin\s*url|linkedin\s*profile)\b/i,
      /linkedin\.com/i
    ],
    getValue: (profile) => profile?.contact?.linkedinUrl || ''
  },
  'candidate.contact.githubUrl': {
    path: 'contact.githubUrl',
    label: 'GitHub Profile URL',
    type: 'url',
    required: false,
    sensitive: false,
    synonyms: [
      /\b(github|github\s*url|github\s*profile|git)\b/i,
      /github\.com/i
    ],
    getValue: (profile) => profile?.contact?.githubUrl || ''
  },
  'candidate.contact.portfolioUrl': {
    path: 'contact.portfolioUrl',
    label: 'Portfolio / Website URL',
    type: 'url',
    required: false,
    sensitive: false,
    synonyms: [
      /\b(portfolio|personal\s*website|website|personal\s*site|portfolio\s*url)\b/i
    ],
    getValue: (profile) => profile?.contact?.portfolioUrl || profile?.contact?.personalWebsite || ''
  },

  // --- PROFESSIONAL & SKILLS ---
  'candidate.professionalProfile.currentTitle': {
    path: 'professionalProfile.currentTitle',
    label: 'Current Job Title',
    type: 'string',
    required: false,
    sensitive: false,
    synonyms: [
      /\b(current\s*title|current\s*role|headline|current\s*position)\b/i
    ],
    getValue: (profile) => profile?.professionalProfile?.currentTitle || profile?.experience?.[0]?.title || ''
  },
  'candidate.professionalProfile.yearsOfExperience': {
    path: 'professionalProfile.yearsOfExperience',
    label: 'Years of Experience',
    type: 'number',
    required: false,
    sensitive: false,
    synonyms: [
      /\b(years\s*of\s*experience|total\s*experience|experience\s*years)\b/i
    ],
    getValue: (profile) => profile?.professionalProfile?.yearsOfExperience || 0
  },

  // --- SENSITIVE LEGAL & WORK AUTHORIZATION ---
  'candidate.workAuthorization.authorizedToWorkInUS': {
    path: 'workAuthorization.authorizedToWorkInUS',
    label: 'Legally Authorized in Target Country',
    type: 'boolean',
    required: true,
    sensitive: true, // SENSITIVE: Never guessed or inferred
    synonyms: [
      /\b(authorized\s*to\s*work|legally\s*authorized|eligible\s*to\s*work|right\s*to\s*work)\b/i,
      /\bwork\s*authorization\b/i
    ],
    getValue: (profile) => {
      const val = profile?.workAuthorization?.authorizedToWorkInUS;
      return val === true || val === false ? val : 'unknown';
    }
  },
  'candidate.workAuthorization.requiresSponsorshipNow': {
    path: 'workAuthorization.requiresSponsorshipNow',
    label: 'Requires Visa Sponsorship Now',
    type: 'boolean',
    required: true,
    sensitive: true, // SENSITIVE: Never guessed or inferred
    synonyms: [
      /\b(require\s*sponsorship|visa\s*sponsorship\s*now|require\s*visa\s*sponsorship|need\s*sponsorship\s*now)\b/i
    ],
    getValue: (profile) => {
      const val = profile?.workAuthorization?.requiresSponsorshipNow;
      return val === true || val === false ? val : 'unknown';
    }
  },
  'candidate.workAuthorization.requiresFutureSponsorship': {
    path: 'workAuthorization.requiresFutureSponsorship',
    label: 'Requires Visa Sponsorship in Future',
    type: 'boolean',
    required: false,
    sensitive: true, // SENSITIVE
    synonyms: [
      /\b(sponsorship\s*in\s*future|future\s*sponsorship|require\s*sponsorship\s*in\s*the\s*future)\b/i
    ],
    getValue: (profile) => {
      const val = profile?.workAuthorization?.requiresFutureSponsorship;
      return val === true || val === false ? val : 'unknown';
    }
  },
  'candidate.workAuthorization.citizenshipStatus': {
    path: 'workAuthorization.citizenshipStatus',
    label: 'Citizenship / Visa Status',
    type: 'string',
    required: false,
    sensitive: true,
    synonyms: [
      /\b(citizenship|visa\s*status|immigration\s*status|visa\s*type)\b/i
    ],
    getValue: (profile) => profile?.workAuthorization?.citizenshipStatus || profile?.workAuthorization?.visaType || ''
  },

  // --- DOCUMENTS ---
  'candidate.documents.primaryResume': {
    path: 'documents.resumes',
    label: 'Primary Resume Document',
    type: 'document',
    required: true,
    sensitive: false,
    synonyms: [
      /\b(resume|cv|curriculum\s*vitae|attach\s*resume|upload\s*resume)\b/i,
      /^resume$/i
    ],
    getValue: (profile) => {
      const resumes = profile?.documents?.resumes || [];
      const defaultResume = resumes.find(r => r.isDefault) || resumes[0];
      return defaultResume || null;
    }
  }
};

class CanonicalFieldRegistry {
  static getField(canonicalPath) {
    return CANONICAL_FIELD_DEFINITIONS[canonicalPath] || null;
  }

  static get(canonicalPath) {
    return CANONICAL_FIELD_DEFINITIONS[canonicalPath] || null;
  }

  static getAll() {
    return CANONICAL_FIELD_DEFINITIONS;
  }

  static getCanonicalKeys() {
    return Object.keys(CANONICAL_FIELD_DEFINITIONS);
  }

  static isSensitive(canonicalPath) {
    return CANONICAL_FIELD_DEFINITIONS[canonicalPath]?.sensitive === true;
  }

  /**
   * Matches an arbitrary DOM field label/name/placeholder to a canonical key.
   * @param {string|Object} textOrField - Field label or { name, label, placeholder }
   * @returns {{ canonicalKey: string, canonicalField: string, confidence: number, fieldDef: Object } | null}
   */
  static resolveFieldMatch(textOrField) {
    if (!textOrField) return null;
    let candidates = [];
    if (typeof textOrField === 'string') {
      candidates = [textOrField];
    } else if (typeof textOrField === 'object') {
      candidates = [textOrField.label, textOrField.name, textOrField.placeholder, textOrField.ariaLabel].filter(Boolean);
    }

    for (const cleanText of candidates) {
      if (typeof cleanText !== 'string') continue;
      const text = cleanText.trim();
      for (const [canonicalKey, def] of Object.entries(CANONICAL_FIELD_DEFINITIONS)) {
        for (const regex of def.synonyms) {
          if (regex.test(text)) {
            const isExact = text.toLowerCase() === def.label.toLowerCase();
            return {
              canonicalKey,
              canonicalField: canonicalKey,
              confidence: isExact ? 0.99 : 0.92,
              fieldDef: def
            };
          }
        }
      }
    }
    return null;
  }

  /**
   * Resolves value from a CandidateProfile instance using canonical field path
   * @param {Object} candidateProfile
   * @param {string} canonicalKey
   */
  static resolveValue(candidateProfile, canonicalKey) {
    // Also support short aliases like candidate.firstName -> candidate.identity.firstName
    const directDef = CANONICAL_FIELD_DEFINITIONS[canonicalKey];
    if (directDef && candidateProfile) {
      return directDef.getValue(candidateProfile);
    }
    
    // Check if canonicalKey is a shorthand, e.g. candidate.firstName -> candidate.identity.firstName
    const normalizedKey = canonicalKey.startsWith('candidate.') ? canonicalKey : `candidate.${canonicalKey}`;
    for (const [key, def] of Object.entries(CANONICAL_FIELD_DEFINITIONS)) {
      if (key === normalizedKey || key.endsWith(`.${canonicalKey.replace(/^candidate\./, '')}`)) {
        return def.getValue(candidateProfile);
      }
    }
    return null;
  }
}

module.exports = {
  CANONICAL_FIELD_DEFINITIONS,
  CanonicalFieldRegistry
};

