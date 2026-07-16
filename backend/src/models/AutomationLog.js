const mongoose = require('mongoose');

const automationLogSchema = new mongoose.Schema({
  applicationSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplicationSession',
    required: true,
  },
  level: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'],
    default: 'INFO',
  },
  event: {
    type: String,
    required: true, // e.g., 'Navigation', 'Click', 'Upload', 'Error'
  },
  message: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: false });

automationLogSchema.index({ applicationSessionId: 1, timestamp: -1 });

module.exports = mongoose.model('AutomationLog', automationLogSchema);
