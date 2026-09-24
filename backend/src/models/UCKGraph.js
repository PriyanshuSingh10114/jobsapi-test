const mongoose = require('mongoose');

/**
 * Universal Candidate Knowledge Graph Schema
 * Collection: uck_profiles
 * Schema Version: 3.0.0
 */
const uckGraphSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  schemaVersion: { type: String, default: '3.0.0' },

  // 1. IDENTITY
  identity: {
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, default: '', trim: true },
    lastName: { type: String, required: true, trim: true },
    preferredName: { type: String, default: '', trim: true },
    pronouns: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' }
  },

  // 2. CONTACT
  contact: {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    secondaryEmail: { type: String, default: '' },
    phone: { type: String, required: true, trim: true },
    countryCode: { type: String, default: '+1' }
  },

  // 3. LOCATION & OFFICE PREFERENCES
  location: {
    country: { type: String, default: 'United States', index: true },
    state: { type: String, required: true, index: true },
    city: { type: String, required: true, index: true },
    address: { type: String, default: '' },
    zipCode: { type: String, required: true, index: true },
    timeZone: { type: String, default: 'America/New_York' },
    preferredOffices: [{ type: String }],
    relocationRadiusMiles: { type: Number, default: 50 }
  },

  // 4. WORK AUTHORIZATION, VISA & LEGAL COMPLIANCE
  authorization: {
    isAuthorizedInUS: { type: Boolean, required: true, default: true },
    requiresSponsorshipNowOrFuture: { type: Boolean, required: true, default: false },
    visaType: { type: String, default: '' }, // H-1B, OPT, TN, Green Card, Citizen
    visaExpirationDate: { type: String, default: '' }
  },
  compliance: {
    isITARUSPerson: { type: Boolean, default: true },
    securityClearance: { 
      type: String, 
      enum: ['None', 'Confidential', 'Secret', 'Top Secret', 'TS/SCI'], 
      default: 'None' 
    },
    clearanceActiveUntil: { type: String, default: '' },
    formerEmployee: { type: Boolean, default: false },
    formerEmployeeDetails: { type: String, default: '' },
    hasNonCompete: { type: Boolean, default: false },
    nonCompeteDetails: { type: String, default: '' }
  },

  // 5. EDUCATION HISTORY
  education: [{
    school: { type: String, required: true },
    degree: { type: String, required: true },
    major: { type: String, required: true },
    gpa: { type: String, default: '' },
    startDate: { type: String, default: '' },
    graduationDate: { type: String, required: true }
  }],

  // 6. EMPLOYMENT HISTORY
  employment: [{
    company: { type: String, required: true },
    title: { type: String, required: true },
    location: { type: String, default: '' },
    startDate: { type: String, required: true },
    endDate: { type: String, default: 'Present' },
    isCurrent: { type: Boolean, default: false },
    responsibilities: { type: String, default: '' },
    achievements: [{ type: String }],
    technologiesUsed: [{ type: String }]
  }],

  // 7. SKILLS TAXONOMY
  skills: {
    languages: [{ type: String }],
    frameworks: [{ type: String }],
    databases: [{ type: String }],
    cloudDevOps: [{ type: String }],
    tools: [{ type: String }],
    softSkills: [{ type: String }]
  },

  // 8. PROFILES & LINKS
  links: {
    linkedin: { type: String, required: true },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    twitter: { type: String, default: '' },
    recommendations: [{ type: String }]
  },

  // 9. DOCUMENTS
  documents: {
    defaultResumePath: { type: String, required: true },
    coverLetterPath: { type: String, default: '' },
    additionalAssets: [{
      name: String,
      path: String,
      type: { type: String, enum: ['Resume', 'CoverLetter', 'Transcript', 'Certificate'] }
    }]
  },

  // 10. US EEO & DEMOGRAPHICS
  demographics: {
    gender: { type: String, enum: ['Male', 'Female', 'Non-Binary', 'Decline'], default: 'Decline' },
    raceEthnicity: { type: String, default: 'Decline' },
    veteranStatus: { type: String, default: 'Decline' },
    disabilityStatus: { type: String, default: 'Decline' }
  },

  // 11. TARGET COMPENSATION & CAREER PREFERENCES
  preferences: {
    desiredMinSalary: { type: Number, default: 0 },
    desiredMaxSalary: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    noticePeriod: { type: String, default: '2 Weeks' },
    willingToRelocate: { type: Boolean, default: false },
    travelPercentWilling: { type: Number, default: 0 },
    workMode: { type: String, enum: ['Remote', 'Hybrid', 'Onsite', 'Any'], default: 'Any' },
    targetRoles: [{ type: String }]
  },

  // 12. RESEARCH & SPECIALIZED ACCOMPLISHMENTS
  research: {
    publications: [{ title: String, journal: String, year: String, url: String }],
    patents: [{ title: String, patentNumber: String, issueDate: String }],
    awards: [{ name: String, issuer: String, date: String }]
  }
}, { timestamps: true });

uckGraphSchema.index({ userId: 1, schemaVersion: 1 });
uckGraphSchema.index({ 'location.state': 1, 'location.city': 1 });

module.exports = mongoose.model('UCKGraph', uckGraphSchema);
