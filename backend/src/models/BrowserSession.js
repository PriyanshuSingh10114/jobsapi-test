const mongoose = require('mongoose');

const browserSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  applicationSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplicationSession',
  },
  userId: {
    type: String,
  },
  connectorName: {
    type: String,
    required: true,
  },
  cookies: {
    type: Array,
    default: []
  },
  localStorage: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  proxyIp: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Crashed'],
    default: 'Active'
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

browserSessionSchema.index({ userId: 1, connectorName: 1 });
browserSessionSchema.index({ status: 1, lastUsedAt: -1 });

module.exports = mongoose.model('BrowserSession', browserSessionSchema);
