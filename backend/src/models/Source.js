const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Arbeitnow', 'Remotive', 'Greenhouse', 'Lever', 'Ashby', 'USAJobs', 'TheMuse'],
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Source', sourceSchema);
