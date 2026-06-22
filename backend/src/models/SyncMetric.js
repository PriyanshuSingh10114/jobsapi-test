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

module.exports = mongoose.model('SyncMetric', syncMetricSchema);
