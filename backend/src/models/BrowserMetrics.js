const mongoose = require('mongoose');

const browserMetricsSchema = new mongoose.Schema({
  applicationSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApplicationSession',
    required: true,
  },
  connectorName: {
    type: String,
    required: true,
  },
  pageLoadDurationMs: {
    type: Number,
  },
  totalDurationMs: {
    type: Number,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  selectorFailures: {
    type: Number,
    default: 0,
  },
  isSuccess: {
    type: Boolean,
    required: true,
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: false });

browserMetricsSchema.index({ connectorName: 1, isSuccess: 1 });
browserMetricsSchema.index({ recordedAt: -1 });

module.exports = mongoose.model('BrowserMetrics', browserMetricsSchema);
