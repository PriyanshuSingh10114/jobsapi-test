const mongoose = require('mongoose');

const syncMetricSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true
  },
  jobsFetched: {
    type: Number,
    required: true
  },
  jobsInserted: {
    type: Number,
    required: true
  },
  jobsUpdated: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  durationMs: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// TTL Index: Automatically expire metric documents 30 days after creation
syncMetricSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('SyncMetric', syncMetricSchema);
