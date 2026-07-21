const mongoose = require('mongoose');

const applicationSessionSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  userId: {
    type: String,
    required: false,
  },
  status: {
    type: String,
    enum: [
      'Created',
      'Queued',
      'WorkerAssigned',
      'BrowserStarting',
      'BrowserReady',
      'LoadingProfile',
      'ValidatingProfile',
      'OpeningJob',
      'AnalyzingPage',
      'AnalyzingForm',
      'ResolvingFields',
      'UploadingResume',
      'GeneratingAIAnswers',
      'FillingFields',
      'ValidatingFilledFields',
      'WaitingForUser',
      'ReadyForSubmission',
      'Submitting',
      'SubmissionVerification',
      'Completed',
      'CompletedWithWarnings',
      'Failed',
      'Cancelled'
    ],
    default: 'Created',
  },
  connectorName: {
    type: String,
    required: true,
  },
  stateData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },
  error: {
    type: String,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  lastUpdatedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

applicationSessionSchema.index({ status: 1 });
applicationSessionSchema.index({ jobId: 1, userId: 1 });

module.exports = mongoose.model('ApplicationSession', applicationSessionSchema);
