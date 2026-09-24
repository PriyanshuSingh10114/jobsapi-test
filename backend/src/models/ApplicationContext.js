const mongoose = require('mongoose');

/**
 * ApplicationContext Schema
 * Collection: application_contexts
 * Layer 4: Job-specific transient context for an application submission.
 * Never writes back into permanent candidate profile.
 */
const applicationContextSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  jobId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  atsKey: { type: String, required: true },
  company: { type: String, required: true },
  appliedUrl: { type: String, required: true },
  
  // Transient Submission Artifacts
  uploadedResumePath: { type: String, default: '' },
  uploadedCoverLetterPath: { type: String, default: '' },
  selectedOffice: { type: String, default: '' },
  submittedSalary: { type: Number, default: 0 },
  submittedAvailability: { type: String, default: '' },

  // Generated & Resolved Questionnaire Answers
  answers: [{
    questionText: { type: String, required: true },
    canonicalKey: { type: String, default: '' },
    answerValue: { type: String, required: true },
    sourceLayer: { 
      type: String, 
      enum: ['ApplicationContext', 'ApplicationMemory', 'ApplicationDefaults', 'PermanentProfile', 'AIGenerated', 'UserOverride'],
      default: 'AIGenerated'
    },
    confidenceScore: { type: Number, default: 1.0 }
  }],

  // Diagnostics & Status
  status: { 
    type: String, 
    enum: ['Created', 'InProcessing', 'WaitingForUser', 'ReadyForSubmission', 'Submitted', 'Failed'], 
    default: 'Created' 
  },
  diagnostics: { type: Object, default: {} }
}, { timestamps: true });

applicationContextSchema.index({ userId: 1, company: 1 });

module.exports = mongoose.model('ApplicationContext', applicationContextSchema);
