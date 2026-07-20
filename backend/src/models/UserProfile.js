const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  major: { type: String, default: '' },
  cgpa: { type: String, default: '' },
  graduationDate: { type: String, default: '' }
}, { _id: true });

const experienceSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  role: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  responsibilities: { type: String, default: '' },
  achievements: { type: String, default: '' },
  technologies: [{ type: String }]
}, { _id: true });

const projectSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  techStack: [{ type: String }],
  githubUrl: { type: String, default: '' },
  demoUrl: { type: String, default: '' },
  impact: { type: String, default: '' }
}, { _id: true });

const certificationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  issuer: { type: String, default: '' },
  issueDate: { type: String, default: '' },
  credentialUrl: { type: String, default: '' },
  credentialId: { type: String, default: '' }
}, { _id: true });

const resumeAssetSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  version: { type: String, default: '' },
  atsScore: { type: Number, default: 0 },
  filePath: { type: String, default: '' },
  isCoverLetter: { type: Boolean, default: false },
  isPortfolio: { type: Boolean, default: false },
  isCertificate: { type: Boolean, default: false }
}, { _id: true });

const userProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },

  // SECTION 1: Basic Identity
  basicInfo: {
    firstName: { type: String, default: '' },
    middleName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    preferredName: { type: String, default: '' },
    email: { type: String, default: '' },
    secondaryEmail: { type: String, default: '' },
    phone: { type: String, default: '' },
    countryCode: { type: String, default: '' },
    dob: { type: String, default: '' },
    pronouns: { type: String, default: '' },
    profilePhoto: { type: String, default: '' }
  },

  // SECTION 2: Location
  location: {
    country: { type: String, default: '' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    address: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    timeZone: { type: String, default: '' },
    willingToRelocate: { type: Boolean, default: false },
    relocationPreferences: { type: String, default: '' }
  },

  // SECTION 3: Professional Links
  links: {
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    personalWebsite: { type: String, default: '' },
    kaggle: { type: String, default: '' },
    medium: { type: String, default: '' },
    devto: { type: String, default: '' },
    stackoverflow: { type: String, default: '' },
    behance: { type: String, default: '' },
    dribbble: { type: String, default: '' },
    googleScholar: { type: String, default: '' },
    orcid: { type: String, default: '' }
  },

  // SECTION 4: Resume Assets
  assets: [resumeAssetSchema],

  // SECTION 5: Professional Info
  professionalInfo: {
    currentCompany: { type: String, default: '' },
    currentPosition: { type: String, default: '' },
    yearsExperience: { type: Number, default: 0 },
    totalExperience: { type: Number, default: 0 },
    relevantExperience: { type: Number, default: 0 },
    currentSalary: { type: String, default: '' },
    expectedSalary: { type: String, default: '' },
    currency: { type: String, default: '' },
    noticePeriod: { type: String, default: '' },
    joiningDate: { type: String, default: '' },
    employmentStatus: { type: String, default: '' }
  },

  // SECTION 6: Education
  education: [educationSchema],

  // SECTION 7: Experience
  experience: [experienceSchema],

  // SECTION 8: Projects
  projects: [projectSchema],

  // SECTION 9: Skills
  skills: {
    languages: [{ type: String }],
    frameworks: [{ type: String }],
    cloud: [{ type: String }],
    devops: [{ type: String }],
    ai: [{ type: String }],
    ml: [{ type: String }],
    security: [{ type: String }],
    databases: [{ type: String }],
    tools: [{ type: String }],
    softSkills: [{ type: String }]
  },

  // SECTION 10: Certifications
  certifications: [certificationSchema],

  // SECTION 11: Work Authorization
  workAuthorization: {
    country: { type: String, default: '' },
    citizen: { type: Boolean, default: false },
    visa: { type: Boolean, default: false },
    visaType: { type: String, default: '' },
    needSponsorship: { type: Boolean, default: false },
    authorizedUntil: { type: String, default: '' },
    securityClearance: { type: String, default: '' }
  },

  // SECTION 12: Preferences
  preferences: {
    remote: { type: Boolean, default: false },
    hybrid: { type: Boolean, default: false },
    onsite: { type: Boolean, default: false },
    travelPercentage: { type: Number, default: 0 },
    preferredRoles: [{ type: String }],
    preferredDomains: [{ type: String }],
    preferredCompanies: [{ type: String }],
    salaryExpectations: { type: String, default: '' }
  },

  // SECTION 13: Demographic
  demographic: {
    gender: { type: String, default: '' },
    race: { type: String, default: '' },
    veteran: { type: String, default: '' },
    disability: { type: String, default: '' },
    ethnicity: { type: String, default: '' },
    selfDescribe: { type: String, default: '' }
  },

  // SECTION 14: AI Generated Profile
  aiProfile: {
    summary: { type: String, default: '' },
    highlights: { type: String, default: '' },
    topSkills: [{ type: String }],
    achievements: { type: String, default: '' },
    strengths: { type: String, default: '' }
  },

  // SECTION 15: AI Answer Bank
  answerBank: {
    tellUsAboutYourself: { type: String, default: '' },
    whyThisCompany: { type: String, default: '' },
    biggestAchievement: { type: String, default: '' },
    failure: { type: String, default: '' },
    leadership: { type: String, default: '' },
    conflict: { type: String, default: '' },
    careerGoals: { type: String, default: '' },
    favoriteProject: { type: String, default: '' },
    expectedSalaryExplanation: { type: String, default: '' },
    noticePeriodExplanation: { type: String, default: '' },
    workAuthorizationExplanation: { type: String, default: '' },
    relocationExplanation: { type: String, default: '' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
