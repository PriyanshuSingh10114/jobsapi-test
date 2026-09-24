/**
 * Canonical Candidate Profile & Preflight Validation Tests
 * Validates ATS-independent canonical field mapping, sensitive zero-guess rules,
 * preflight validation, idempotency fingerprinting, and readiness calculations.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { CanonicalFieldRegistry } = require('../../src/automation/canonical/CanonicalFieldRegistry');
const ApplicationPreflightValidator = require('../../src/automation/engine/ApplicationPreflightValidator');
const ApplicationIdempotencyService = require('../../src/automation/engine/ApplicationIdempotencyService');
const ProfileReadinessCalculator = require('../../src/automation/engine/ProfileReadinessCalculator');
const ATSAdapterFactory = require('../../src/automation/adapters/ATSAdapterFactory');
const GreenhouseAdapter = require('../../src/automation/adapters/GreenhouseAdapter');
const LeverAdapter = require('../../src/automation/adapters/LeverAdapter');
const AshbyAdapter = require('../../src/automation/adapters/AshbyAdapter');
const WorkdayAdapter = require('../../src/automation/adapters/WorkdayAdapter');


// Sample verified candidate profile
const validCandidate = {
  _id: 'cand_12345',
  identity: {
    firstName: 'Jane',
    lastName: 'Doe',
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+1 (415) 555-0199'
  },
  location: {
    addressLine1: '123 Market St',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'United States',
    timezone: 'America/Los_Angeles'
  },
  contact: {
    linkedinUrl: 'https://linkedin.com/in/janedoe',
    githubUrl: 'https://github.com/janedoe',
    portfolioUrl: 'https://janedoe.dev'
  },
  professionalProfile: {
    currentTitle: 'Senior Full Stack Engineer',
    professionalSummary: 'Full stack engineer with 6+ years experience in Node.js and React.',
    yearsOfExperience: 6,
    skills: ['Node.js', 'React', 'TypeScript', 'MongoDB', 'AWS']
  },
  workAuthorization: {
    authorizedToWorkInUS: true,
    requiresSponsorshipNow: false,
    requiresFutureSponsorship: false,
    citizenshipStatus: 'US Citizen',
    relocationPreference: 'willing_to_relocate'
  },
  experience: [
    {
      company: 'Acme Corp',
      title: 'Senior Software Engineer',
      employmentType: 'full-time',
      startDate: new Date('2021-01-01'),
      current: true,
      description: 'Building high throughput APIs'
    }
  ],
  education: [
    {
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: new Date('2015-08-01'),
      endDate: new Date('2019-05-15')
    }
  ],
  documents: {
    resumes: [
      {
        id: 'res_001',
        name: 'Jane_Doe_Resume_2026.pdf',
        storageKey: 'resumes/res_001.pdf',
        mimeType: 'application/pdf',
        size: 1048576,
        isDefault: true
      }
    ]
  },
  preferences: {
    desiredTitles: ['Senior Software Engineer', 'Staff Engineer'],
    blockedCompanies: ['BadCompany Inc', 'Unethical Corp'],
    blockedRoles: ['Intern', 'Crypto Trader']
  }
};

test('CanonicalFieldRegistry: Synonym matching maps varied form field labels to canonical fields', () => {
  const synonymsToTest = [
    { input: { name: 'first_name', label: 'First Name' }, expected: 'candidate.identity.firstName' },
    { input: { name: 'given_name', label: 'Given Name' }, expected: 'candidate.identity.firstName' },
    { input: { name: 'legal_first_name', label: 'Legal First Name' }, expected: 'candidate.identity.firstName' },
    { input: { name: 'last_name', label: 'Family Name / Surname' }, expected: 'candidate.identity.lastName' },
    { input: { name: 'email_address', label: 'Email Address' }, expected: 'candidate.identity.email' },
    { input: { name: 'cell_phone', label: 'Phone Number' }, expected: 'candidate.identity.phone' },
    { input: { name: 'zip_code', label: 'Postal / ZIP Code' }, expected: 'candidate.location.postalCode' },
    { input: { name: 'linkedin', label: 'LinkedIn Profile URL' }, expected: 'candidate.contact.linkedinUrl' },
    { input: { name: 'github', label: 'GitHub Profile URL' }, expected: 'candidate.contact.githubUrl' },
    { input: { name: 'us_work_auth', label: 'Are you legally authorized to work in the United States?' }, expected: 'candidate.workAuthorization.authorizedToWorkInUS' },
    { input: { name: 'sponsorship_required', label: 'Will you now or in the future require visa sponsorship?' }, expected: 'candidate.workAuthorization.requiresSponsorshipNow' }
  ];

  for (const item of synonymsToTest) {
    const match = CanonicalFieldRegistry.resolveFieldMatch(item.input);
    assert.ok(match, `Expected a match for "${item.input.label}"`);
    assert.equal(match.canonicalField, item.expected, `Label "${item.input.label}" should map to "${item.expected}"`);
    assert.ok(match.confidence >= 0.8, `Confidence should be >= 0.8 for "${item.input.label}"`);
  }
});


test('CanonicalFieldRegistry: Value resolution correctly extracts values from candidate document', () => {
  const resolvedFirstName = CanonicalFieldRegistry.resolveValue(validCandidate, 'candidate.firstName');
  assert.equal(resolvedFirstName, 'Jane');

  const resolvedPostal = CanonicalFieldRegistry.resolveValue(validCandidate, 'candidate.location.postalCode');
  assert.equal(resolvedPostal, '94105');

  const resolvedWorkAuth = CanonicalFieldRegistry.resolveValue(validCandidate, 'candidate.workAuthorization.authorizedToWorkInUS');
  assert.equal(resolvedWorkAuth, true);

  const resolvedResume = CanonicalFieldRegistry.resolveValue(validCandidate, 'candidate.documents.primaryResume');
  assert.equal(resolvedResume?.id, 'res_001');
});

test('CanonicalFieldRegistry: Sensitive fields are strictly flagged and never guessed', () => {
  const sensitiveField = CanonicalFieldRegistry.getField('candidate.workAuthorization.requiresSponsorshipNow');
  assert.ok(sensitiveField?.sensitive, 'Sponsorship field must be flagged sensitive');

  const authField = CanonicalFieldRegistry.getField('candidate.workAuthorization.authorizedToWorkInUS');
  assert.ok(authField?.sensitive, 'Work authorization field must be flagged sensitive');
});

test('ApplicationPreflightValidator: Passes valid, complete candidate for job', () => {
  const job = {
    title: 'Senior Software Engineer',
    company: 'Stripe',
    location: 'San Francisco, CA',
    url: 'https://boards.greenhouse.io/stripe/jobs/12345'
  };

  const preflight = ApplicationPreflightValidator.validateCandidateForJob(validCandidate, job);
  assert.equal(preflight.ready, true);
  assert.equal(preflight.missing.length, 0);
  assert.equal(preflight.blocked.length, 0);
  assert.equal(preflight.unresolved.length, 0);
});

test('ApplicationPreflightValidator: Blocks application if company or role is in candidate blocklist', () => {
  const blockedCompanyJob = {
    title: 'Senior Software Engineer',
    company: 'BadCompany Inc',
    location: 'Remote',
    url: 'https://jobs.lever.co/badcompany/123'
  };

  const preflight = ApplicationPreflightValidator.validateCandidateForJob(validCandidate, blockedCompanyJob);
  assert.equal(preflight.ready, false);
  assert.ok(preflight.blocked.length > 0, 'Must block due to blocked company');
});

test('ApplicationPreflightValidator: Fails if sensitive work authorization is unknown/missing', () => {
  const unverifiedCandidate = {
    ...validCandidate,
    workAuthorization: {
      authorizedToWorkInUS: null, // missing/unknown
      requiresSponsorshipNow: null
    }
  };

  const job = {
    title: 'Staff Engineer',
    company: 'Airbnb',
    location: 'Remote',
    url: 'https://careers.airbnb.com/positions/456'
  };

  const preflight = ApplicationPreflightValidator.validateCandidateForJob(unverifiedCandidate, job);
  assert.equal(preflight.ready, false, 'Preflight must fail when work authorization is unresolved');
  assert.ok(preflight.unresolved.includes('candidate.workAuthorization.authorizedToWorkInUS'));
});

test('ApplicationIdempotencyService: Generates deterministic SHA-256 fingerprint & detects duplicates', () => {
  const candidateId = 'cand_12345';
  const jobId = 'job_99999';
  const destination = 'https://boards.greenhouse.io/stripe/jobs/12345';

  const hash1 = ApplicationIdempotencyService.generateFingerprint(candidateId, jobId, destination);
  const hash2 = ApplicationIdempotencyService.generateFingerprint(candidateId, jobId, destination);

  assert.equal(hash1, hash2, 'Fingerprint must be deterministic');
  assert.equal(hash1.length, 64, 'Fingerprint must be a 64-character SHA-256 hex string');

  // Distinct destination must produce distinct hash
  const hash3 = ApplicationIdempotencyService.generateFingerprint(candidateId, jobId, 'https://jobs.lever.co/stripe/12345');
  assert.notEqual(hash1, hash3);
});

test('ProfileReadinessCalculator: Accurately calculates honest readiness categories', () => {
  const readiness = ProfileReadinessCalculator.calculateReadiness(validCandidate);
  
  assert.equal(readiness.isReady, true);
  assert.ok(readiness.overallScore >= 80, 'Score should be high for complete candidate');
  assert.equal(readiness.categories.identity.status, 'Complete');
  assert.equal(readiness.categories.workAuthorization.status, 'Complete');
  assert.equal(readiness.categories.experience.status, 'Complete');
  assert.equal(readiness.categories.education.status, 'Complete');
  assert.equal(readiness.categories.documents.status, 'Complete');
});

test('ProfileReadinessCalculator: Flags incomplete profile when critical info is missing', () => {
  const bareCandidate = {
    identity: { firstName: 'John' }
  };

  const readiness = ProfileReadinessCalculator.calculateReadiness(bareCandidate);
  assert.equal(readiness.isReady, false);
  assert.equal(readiness.categories.contact.status, 'Incomplete');
  assert.equal(readiness.categories.workAuthorization.status, 'Unknown');
});

test('ATSAdapterFactory: Resolves specific adapters for Greenhouse, Lever, Ashby, Workday', () => {
  const gh = ATSAdapterFactory.getAdapter('greenhouse');
  assert.ok(gh instanceof GreenhouseAdapter);
  assert.equal(gh.atsName, 'greenhouse');

  const lever = ATSAdapterFactory.getAdapter('lever');
  assert.ok(lever instanceof LeverAdapter);
  assert.equal(lever.atsName, 'lever');

  const ashby = ATSAdapterFactory.getAdapter('ashby');
  assert.ok(ashby instanceof AshbyAdapter);
  assert.equal(ashby.atsName, 'ashby');

  const workday = ATSAdapterFactory.getAdapter('workday');
  assert.ok(workday instanceof WorkdayAdapter);
  assert.equal(workday.atsName, 'workday');
});

