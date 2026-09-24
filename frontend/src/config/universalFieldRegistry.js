/**
 * Universal ATS Field Registry (Frontend Configuration)
 * File: frontend/src/config/universalFieldRegistry.js
 */

export const UNIVERSAL_FIELD_REGISTRY = [
  // SECTION 1: CORE IDENTITY
  {
    canonicalId: 'identity.firstName',
    displayName: 'First Name',
    description: 'Legal given name',
    section: 'identity',
    subsection: 'basic',
    inputType: 'text',
    dataType: 'string',
    isRequired: true,
    frequencyPercent: 100,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: 'Jane'
  },
  {
    canonicalId: 'identity.middleName',
    displayName: 'Middle Name',
    description: 'Middle or second given name',
    section: 'identity',
    subsection: 'basic',
    inputType: 'text',
    dataType: 'string',
    isRequired: false,
    frequencyPercent: 60,
    atsPlatforms: ['Workday', 'Taleo', 'iCIMS', 'Oracle', 'USAJobs'],
    exampleValue: 'Marie'
  },
  {
    canonicalId: 'identity.lastName',
    displayName: 'Last Name',
    description: 'Legal family name',
    section: 'identity',
    subsection: 'basic',
    inputType: 'text',
    dataType: 'string',
    isRequired: true,
    frequencyPercent: 100,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: 'Doe'
  },
  {
    canonicalId: 'identity.preferredName',
    displayName: 'Preferred Name / Nickname',
    description: 'Chosen or preferred name for communications',
    section: 'identity',
    subsection: 'basic',
    inputType: 'text',
    dataType: 'string',
    isRequired: false,
    frequencyPercent: 75,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters'],
    exampleValue: 'Alex'
  },
  {
    canonicalId: 'identity.pronouns',
    displayName: 'Preferred Pronouns',
    description: 'Gender pronouns (e.g. She/Her, They/Them)',
    section: 'identity',
    subsection: 'basic',
    inputType: 'text',
    dataType: 'string',
    isRequired: false,
    frequencyPercent: 65,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby'],
    exampleValue: 'They/Them'
  },

  // SECTION 2: CONTACT INFORMATION
  {
    canonicalId: 'contact.email',
    displayName: 'Primary Email Address',
    description: 'Primary contact email address',
    section: 'contact',
    subsection: 'primary',
    inputType: 'email',
    dataType: 'string',
    isRequired: true,
    frequencyPercent: 100,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: 'jane.doe@example.com'
  },
  {
    canonicalId: 'contact.phone',
    displayName: 'Phone Number',
    description: 'Primary mobile or phone number',
    section: 'contact',
    subsection: 'primary',
    inputType: 'tel',
    dataType: 'string',
    isRequired: true,
    frequencyPercent: 100,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: '+1 (555) 019-2831'
  },

  // SECTION 3: LOCATION
  {
    canonicalId: 'location.country',
    displayName: 'Country of Residence',
    description: 'Primary country of residence',
    section: 'location',
    subsection: 'address',
    inputType: 'text',
    dataType: 'string',
    isRequired: true,
    frequencyPercent: 98,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: 'United States'
  },
  {
    canonicalId: 'location.state',
    displayName: 'State / Province',
    description: 'State or territory',
    section: 'location',
    subsection: 'address',
    inputType: 'text',
    dataType: 'string',
    isRequired: true,
    frequencyPercent: 98,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: 'California'
  },
  {
    canonicalId: 'location.city',
    displayName: 'City',
    description: 'City of residence',
    section: 'location',
    subsection: 'address',
    inputType: 'text',
    dataType: 'string',
    isRequired: true,
    frequencyPercent: 98,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: 'San Francisco'
  },
  {
    canonicalId: 'location.zipCode',
    displayName: 'Zip / Postal Code',
    description: 'Postal or Zip code',
    section: 'location',
    subsection: 'address',
    inputType: 'text',
    dataType: 'string',
    isRequired: true,
    frequencyPercent: 95,
    atsPlatforms: ['Workday', 'iCIMS', 'Taleo', 'Oracle', 'SmartRecruiters'],
    exampleValue: '94107'
  },

  // SECTION 4: WORK AUTHORIZATION & COMPLIANCE
  {
    canonicalId: 'authorization.isAuthorizedInUS',
    displayName: 'US Work Authorization Status',
    description: 'Are you legally authorized to work in the United States?',
    section: 'authorization',
    subsection: 'us_legal',
    inputType: 'select',
    dataType: 'boolean',
    options: [
      { label: 'Yes - Legally Authorized', value: true },
      { label: 'No - Not Authorized', value: false }
    ],
    isRequired: true,
    frequencyPercent: 96,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: true
  },
  {
    canonicalId: 'authorization.requiresSponsorshipNowOrFuture',
    displayName: 'Visa Sponsorship Requirement',
    description: 'Will you now or in the future require visa sponsorship for employment?',
    section: 'authorization',
    subsection: 'us_legal',
    inputType: 'select',
    dataType: 'boolean',
    options: [
      { label: 'No - Sponsorship Not Required', value: false },
      { label: 'Yes - Sponsorship Required', value: true }
    ],
    isRequired: true,
    frequencyPercent: 95,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: false
  },
  {
    canonicalId: 'compliance.isITARUSPerson',
    displayName: 'US ITAR / EAR Export Control Status',
    description: 'Are you a US Citizen, Permanent Resident (Green Card holder), or Protected Individual under ITAR/EAR?',
    section: 'authorization',
    subsection: 'defense_compliance',
    inputType: 'select',
    dataType: 'boolean',
    options: [
      { label: 'Yes - US Person under ITAR/EAR', value: true },
      { label: 'No - Non-US Person', value: false }
    ],
    isRequired: false,
    frequencyPercent: 45,
    atsPlatforms: ['Greenhouse', 'Lever', 'Workday', 'iCIMS'],
    shouldBeAdvanced: true,
    exampleValue: true
  },
  {
    canonicalId: 'compliance.securityClearance',
    displayName: 'US Security Clearance Level',
    description: 'Active US Government Security Clearance Level',
    section: 'authorization',
    subsection: 'defense_compliance',
    inputType: 'select',
    dataType: 'string',
    options: [
      { label: 'None', value: 'None' },
      { label: 'Confidential', value: 'Confidential' },
      { label: 'Secret', value: 'Secret' },
      { label: 'Top Secret', value: 'Top Secret' },
      { label: 'Top Secret / SCI (TS/SCI)', value: 'TS/SCI' }
    ],
    isRequired: false,
    frequencyPercent: 42,
    atsPlatforms: ['Workday', 'Oracle', 'iCIMS', 'USAJobs'],
    shouldBeAdvanced: true,
    exampleValue: 'None'
  },

  // SECTION 5: PROFILES & SOCIAL LINKS
  {
    canonicalId: 'links.linkedin',
    displayName: 'LinkedIn Profile URL',
    description: 'Link to your primary LinkedIn profile',
    section: 'links',
    subsection: 'social',
    inputType: 'url',
    dataType: 'string',
    isRequired: false,
    frequencyPercent: 94,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters'],
    exampleValue: 'https://linkedin.com/in/janedoe'
  },
  {
    canonicalId: 'links.github',
    displayName: 'GitHub Profile URL',
    description: 'Link to your GitHub profile or organization',
    section: 'links',
    subsection: 'social',
    inputType: 'url',
    dataType: 'string',
    isRequired: false,
    frequencyPercent: 82,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby'],
    exampleValue: 'https://github.com/janedoe'
  },
  {
    canonicalId: 'links.portfolio',
    displayName: 'Portfolio / Personal Website URL',
    description: 'Link to your personal website or portfolio',
    section: 'links',
    subsection: 'social',
    inputType: 'url',
    dataType: 'string',
    isRequired: false,
    frequencyPercent: 78,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'SmartRecruiters'],
    exampleValue: 'https://janedoe.dev'
  },

  // SECTION 6: TARGET PREFERENCES & COMPENSATION
  {
    canonicalId: 'preferences.desiredMinSalary',
    displayName: 'Desired Annual Base Salary ($ USD)',
    description: 'Minimum target annual compensation in USD',
    section: 'preferences',
    subsection: 'compensation',
    inputType: 'number',
    dataType: 'number',
    isRequired: false,
    frequencyPercent: 75,
    atsPlatforms: ['Workday', 'SmartRecruiters', 'Taleo', 'Oracle', 'iCIMS'],
    exampleValue: 140000
  },
  {
    canonicalId: 'preferences.noticePeriod',
    displayName: 'Notice Period / Earliest Start Date',
    description: 'Your availability to begin a new role',
    section: 'preferences',
    subsection: 'availability',
    inputType: 'select',
    dataType: 'string',
    options: [
      { label: 'Immediate / Ready Now', value: 'Immediate' },
      { label: '2 Weeks Notice', value: '2 Weeks' },
      { label: '1 Month Notice', value: '1 Month' },
      { label: 'More than 1 Month', value: '1+ Month' }
    ],
    isRequired: false,
    frequencyPercent: 72,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS'],
    exampleValue: '2 Weeks'
  },
  {
    canonicalId: 'preferences.willingToRelocate',
    displayName: 'Willingness to Relocate',
    description: 'Are you open to relocating for the right opportunity?',
    section: 'preferences',
    subsection: 'mobility',
    inputType: 'select',
    dataType: 'boolean',
    options: [
      { label: 'Yes - Willing to Relocate', value: true },
      { label: 'No - Local / Remote Only', value: false }
    ],
    isRequired: false,
    frequencyPercent: 68,
    atsPlatforms: ['Workday', 'SmartRecruiters', 'Taleo', 'Oracle', 'iCIMS'],
    exampleValue: false
  },

  // SECTION 7: US EEO DEMOGRAPHICS
  {
    canonicalId: 'demographics.gender',
    displayName: 'Gender Identity (US EEO)',
    description: 'Equal Employment Opportunity Gender Self-Identification',
    section: 'demographics',
    subsection: 'eeo',
    inputType: 'select',
    dataType: 'string',
    options: [
      { label: 'Male', value: 'Male' },
      { label: 'Female', value: 'Female' },
      { label: 'Non-Binary / Gender Diverse', value: 'Non-Binary' },
      { label: 'Decline to Disclose', value: 'Decline' }
    ],
    isRequired: false,
    frequencyPercent: 88,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: 'Decline'
  },
  {
    canonicalId: 'demographics.raceEthnicity',
    displayName: 'Race / Ethnicity (US EEO)',
    description: 'Equal Employment Opportunity Race & Ethnicity Self-Identification',
    section: 'demographics',
    subsection: 'eeo',
    inputType: 'select',
    dataType: 'string',
    options: [
      { label: 'American Indian or Alaska Native', value: 'American Indian' },
      { label: 'Asian', value: 'Asian' },
      { label: 'Black or African American', value: 'Black' },
      { label: 'Hispanic or Latino', value: 'Hispanic' },
      { label: 'Native Hawaiian or Other Pacific Islander', value: 'Pacific Islander' },
      { label: 'White', value: 'White' },
      { label: 'Two or More Races', value: 'Two or More' },
      { label: 'Decline to Disclose', value: 'Decline' }
    ],
    isRequired: false,
    frequencyPercent: 88,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: 'Decline'
  },
  {
    canonicalId: 'demographics.veteranStatus',
    displayName: 'Veteran Status (US VEVRAA)',
    description: 'Protected Veteran Self-Identification under VEVRAA',
    section: 'demographics',
    subsection: 'eeo',
    inputType: 'select',
    dataType: 'string',
    options: [
      { label: 'I am a protected veteran', value: 'Veteran' },
      { label: 'I am not a protected veteran', value: 'NotVeteran' },
      { label: 'Decline to Disclose', value: 'Decline' }
    ],
    isRequired: false,
    frequencyPercent: 88,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: 'Decline'
  },
  {
    canonicalId: 'demographics.disabilityStatus',
    displayName: 'Disability Status (US Form CC-305)',
    description: 'Voluntary Self-Identification of Disability under Form CC-305',
    section: 'demographics',
    subsection: 'eeo',
    inputType: 'select',
    dataType: 'string',
    options: [
      { label: 'Yes, I have a disability or previously had a disability', value: 'Yes' },
      { label: 'No, I do not have a disability', value: 'No' },
      { label: 'Decline to Disclose', value: 'Decline' }
    ],
    isRequired: false,
    frequencyPercent: 88,
    atsPlatforms: ['Greenhouse', 'Lever', 'Ashby', 'Workday', 'SmartRecruiters', 'iCIMS', 'Taleo', 'Oracle'],
    exampleValue: 'Decline'
  }
];

export default UNIVERSAL_FIELD_REGISTRY;
