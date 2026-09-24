const mongoose = require('mongoose');

/**
 * ApplicationMemory Schema
 * Collection: application_memories
 * Stores historical company-specific questionnaire answers for answer reuse.
 */
const applicationMemorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  companyNormalized: { type: String, required: true, index: true }, // e.g. "google", "space_x"
  companyDisplayName: { type: String, required: true },
  
  qaPairs: [{
    questionText: { type: String, required: true },
    normalizedPrompt: { type: String, required: true }, // lowercased regex key
    answerValue: { type: String, required: true },
    timesUsed: { type: Number, default: 1 },
    lastUsedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

applicationMemorySchema.index({ userId: 1, companyNormalized: 1 }, { unique: true });

module.exports = mongoose.model('ApplicationMemory', applicationMemorySchema);
