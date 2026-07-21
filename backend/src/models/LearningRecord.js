const mongoose = require('mongoose');

const learningRecordSchema = new mongoose.Schema({
  userId: {
    type: String, // Clerk userId if logged in, otherwise anonymous
    required: false,
    index: true
  },
  connectorName: {
    type: String,
    required: true, // e.g., 'greenhouse'
    index: true
  },
  fieldLabel: {
    type: String,
    required: true,
  },
  fieldName: {
    type: String,
  },
  fieldType: {
    type: String,
  },
  parentSection: {
    type: String,
  },
  occurrences: {
    type: Number,
    default: 1
  },
  resolvedSemanticKey: {
    type: String, // Filled in later by admin or user feedback to train the system
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  lastSeenUrl: {
    type: String,
  }
}, { timestamps: true });

// Compound index to ensure uniqueness for counting occurrences
learningRecordSchema.index({ connectorName: 1, fieldLabel: 1 }, { unique: true });

module.exports = mongoose.model('LearningRecord', learningRecordSchema);
