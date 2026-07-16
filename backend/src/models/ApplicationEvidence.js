const mongoose = require('mongoose');

const applicationEvidenceSchema = new mongoose.Schema({
  applicationSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplicationSession',
    required: true,
  },
  type: {
    type: String,
    enum: ['Screenshot', 'Upload', 'Log'],
    required: true,
  },
  checkpoint: {
    type: String, // e.g., 'BeforeApply', 'AfterSubmit', 'OnFailure'
    required: true,
  },
  filePath: {
    type: String, // Local path or S3 URL
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: false });

applicationEvidenceSchema.index({ applicationSessionId: 1 });

module.exports = mongoose.model('ApplicationEvidence', applicationEvidenceSchema);
