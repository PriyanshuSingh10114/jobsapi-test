const mongoose = require('mongoose');

/**
 * Canonical Candidate Profile Schema
 * Represents a universal candidate profile independent of any single ATS platform.
 * Serves as the single source of truth for all auto-apply operations.
 */

const experienceSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  company: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  location: { type: String, default: '', trim: true },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance', 'temporary', 'volunteer', 'other'],
    default: 'full-time'
  },
  startDate: { type: String, required: true }, // Format: YYYY-MM or YYYY-MM-DD
  endDate: { type: String, default: '' },       // Empty or 'Present' if current
  current: { type: Boolean, default: false },
  description: { type: String, default: '' },
  achievements: [{ type: String, trim: true }],
  skills: [{ type: String, trim: true }]
}, { _id: true, timestamps: true });

const educationSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  institution: { type: String, required: true, trim: true },
  degree: { type: String, required: true, trim: true },
  fieldOfStudy: { type: String, required: true, trim: true },
  location: { type: String, default: '', trim: true },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  current: { type: Boolean, default: false },
  gpa: { type: String, default: '' },
  achievements: [{ type: String, trim: true }]
}, { _id: true, timestamps: true });

const certificationSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true, trim: true },
  issuingOrganization: { type: String, required: true, trim: true },
  credentialId: { type: String, default: '' },
  issueDate: { type: String, default: '' },
  expirationDate: { type: String, default: '' },
  credentialUrl: { type: String, default: '' }
}, { _id: true, timestamps: true });

const documentAssetSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['resume', 'cover_letter', 'certification', 'transcript', 'other'],
    default: 'resume'
  },
  storageKey: { type: String, required: true }, // Internal secure identifier/filename
  mimeType: { type: String, default: 'application/pdf' },
  size: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false },
  parsedText: { type: String, default: '' },
  atsScore: { type: Number, default: 0 }
}, { _id: true, timestamps: true });

const applicationAnswerSchema = new mongoose.Schema({
  questionKey: { type: String, required: true, trim: true, index: true },
  questionText: { type: String, required: true, trim: true },
  answerType: {
    type: String,
    enum: ['text', 'number', 'boolean', 'single_select', 'multi_select', 'date', 'url', 'country', 'state', 'unknown'],
    default: 'text'
  },
  value: { type: mongoose.Schema.Types.Mixed, default: null },
  source: {
    type: String,
    enum: ['user_verified', 'system_inferred', 'profile_default', 'unknown'],
    default: 'user_verified'
  },
  confidence: { type: Number, min: 0, max: 1, default: 1.0 },
  userVerified: { type: Boolean, default: true },
  lastVerifiedAt: { type: Date, default: Date.now }
}, { _id: true });

const candidateProfileSchema = new mongoose.Schema({
  candidateId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true }, // Clerk or local auth reference
  version: { type: String, default: '2.0.0' },

  // 1. IDENTITY
  identity: {
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, default: '', trim: true },
    lastName: { type: String, required: true, trim: true },
    preferredName: { type: String, default: '', trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    alternateEmail: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    countryCode: { type: String, default: '+1' }
  },

  // 2. LOCATION (International schema with US optimization)
  location: {
    addressLine1: { type: String, default: '', trim: true },
    addressLine2: { type: String, default: '', trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true, index: true },
    postalCode: { type: String, required: true, trim: true, index: true },
    country: { type: String, default: 'United States', index: true },
    timezone: { type: String, default: 'America/New_York' }
  },

  // 3. CONTACT & ONLINE PRESENCE
  contact: {
    linkedinUrl: { type: String, default: '', trim: true },
    githubUrl: { type: String, default: '', trim: true },
    portfolioUrl: { type: String, default: '', trim: true },
    personalWebsite: { type: String, default: '', trim: true },
    otherUrls: [{ type: String, trim: true }]
  },

  // 4. PROFESSIONAL PROFILE
  professionalProfile: {
    currentTitle: { type: String, default: '', trim: true },
    professionalSummary: { type: String, default: '', trim: true },
    yearsOfExperience: { type: Number, default: 0 },
    skills: [{ type: String, trim: true }],        // Normalized skills (e.g., 'Node.js', 'Kubernetes')
    rawSkills: [{ type: String, trim: true }],     // Candidate original wording preserved
    industries: [{ type: String, trim: true }],
    jobTitles: [{ type: String, trim: true }],
    languages: [{
      language: { type: String, required: true },
      proficiency: {
        type: String,
        enum: ['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'],
        default: 'Fluent'
      }
    }]
  },

  // 5. WORK AUTHORIZATION & LEGAL COMPLIANCE (Never inferred, strictly explicit)
  workAuthorization: {
    authorizedToWorkInUS: { type: mongoose.Schema.Types.Mixed, default: 'unknown' }, // true | false | 'unknown'
    requiresSponsorshipNow: { type: mongoose.Schema.Types.Mixed, default: 'unknown' }, // true | false | 'unknown'
    requiresFutureSponsorship: { type: mongoose.Schema.Types.Mixed, default: 'unknown' }, // true | false | 'unknown'
    sponsorshipDetails: { type: String, default: '' },
    visaType: { type: String, default: '' }, // Citizen, Green Card, H-1B, OPT, TN, E-3, etc.
    citizenshipStatus: { type: String, default: '' },
    relocationPreference: {
      type: String,
      enum: ['yes', 'no', 'remote_only', 'unknown'],
      default: 'unknown'
    }
  },

  // 6. EMPLOYMENT HISTORY
  experience: [experienceSchema],

  // 7. EDUCATION HISTORY
  education: [educationSchema],

  // 8. CERTIFICATIONS
  certifications: [certificationSchema],

  // 9. DOCUMENTS (Resumes, Cover Letters, Transcripts)
  documents: {
    resumes: [documentAssetSchema],
    coverLetters: [documentAssetSchema],
    certifications: [documentAssetSchema],
    transcripts: [documentAssetSchema],
    other: [documentAssetSchema]
  },

  // 10. JOB PREFERENCES
  preferences: {
    desiredTitles: [{ type: String, trim: true }],
    desiredLocations: [{ type: String, trim: true }],
    preferredIndustries: [{ type: String, trim: true }],
    employmentTypes: [{ type: String, trim: true }], // 'Full-time', 'Contract', etc.
    workModes: [{ type: String, enum: ['remote', 'hybrid', 'onsite'], default: 'remote' }],
    willingToRelocate: { type: Boolean, default: false },
    minimumSalary: { type: Number, default: 0 },
    salaryCurrency: { type: String, default: 'USD' },
    salaryPeriod: { type: String, enum: ['yearly', 'monthly', 'hourly'], default: 'yearly' },
    preferredCountries: [{ type: String, default: 'United States' }],
    blockedCompanies: [{ type: String, trim: true }],
    blockedRoles: [{ type: String, trim: true }]
  },

  // 11. APPLICATION QUESTION & ANSWER BANK
  applicationAnswers: [applicationAnswerSchema],

  // 12. EEO & DEMOGRAPHIC DATA (Optional, protected self-identification)
  demographics: {
    gender: { type: String, default: 'Decline to self-identify' },
    raceEthnicity: { type: String, default: 'Decline to self-identify' },
    veteranStatus: { type: String, default: 'Decline to self-identify' },
    disabilityStatus: { type: String, default: 'Decline to self-identify' }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual full name
candidateProfileSchema.virtual('identity.fullName').get(function () {
  const parts = [this.identity?.firstName, this.identity?.middleName, this.identity?.lastName].filter(Boolean);
  return parts.join(' ');
});

// Compound indexes for rapid lookup and deduplication
candidateProfileSchema.index({ candidateId: 1, 'identity.email': 1 });
candidateProfileSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);
