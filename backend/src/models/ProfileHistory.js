const mongoose = require('mongoose');

/**
 * ProfileHistory Schema
 * Collection: profile_histories
 * Tracks field edit audit logs, provenance sources, and version history.
 */
const profileHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fieldCanonicalId: { type: String, required: true, index: true },
  oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
  newValue: { type: mongoose.Schema.Types.Mixed, default: null },
  source: { 
    type: String, 
    enum: ['User', 'ResumeParser', 'LinkedInImport', 'GitHubImport', 'AIGenerated', 'ApplicationMemory'],
    required: true 
  },
  confidenceScore: { type: Number, default: 1.0 },
  changedBy: { type: String, default: 'User' }
}, { timestamps: true });

profileHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ProfileHistory', profileHistorySchema);
