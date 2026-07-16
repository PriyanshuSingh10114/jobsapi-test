const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Arbeitnow', 'Remotive', 'Greenhouse', 'Lever', 'Ashby', 'USAJobs', 'TheMuse', 'SmartRecruiters', 'Workday', 'Jobvite', 'Teamtailor', 'Recruitee', 'BambooHR'],
  },
  lastSync: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['Healthy', 'Degraded', 'Failed', 'Pending'],
    default: 'Pending',
  },
  jobCount: {
    type: Number,
    default: 0,
  },
  lastError: {
    type: String,
  },
  last_success: { type: Date },
  latency: { type: Number, default: 0 },
  jobs_fetched: { type: Number, default: 0 },
  jobs_inserted: { type: Number, default: 0 },
  jobs_updated: { type: Number, default: 0 },
  jobs_skipped: { type: Number, default: 0 },
  failure_count: { type: Number, default: 0 },
  consecutive_failures: { type: Number, default: 0 },
  average_duration: { type: Number, default: 0 },
  success_rate: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Source', sourceSchema);
