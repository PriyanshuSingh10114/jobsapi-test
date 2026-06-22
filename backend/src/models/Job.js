const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: 'Unknown',
  },
  source: {
    type: String,
    required: true,
    enum: ['Arbeitnow', 'Remotive', 'Greenhouse', 'Lever', 'Ashby', 'USAJobs', 'TheMuse'],
  },
  applyUrl: {
    type: String,
    required: true,
    unique: true, // Use this for deduplication
  },
  description: {
    type: String,
  },
  postedAt: {
    type: Date,
  },
  remote: {
    type: Boolean,
    default: false,
  },
  jobType: {
    type: String,
    default: 'Full-time',
  },
  experienceLevel: {
    type: String,
    default: 'Mid Level',
  }
}, { timestamps: true });

// Existing unique index for deduplication
jobSchema.index({ applyUrl: 1, source: 1 }, { unique: true });

// Text index for search
jobSchema.index({ title: 'text', company: 'text', description: 'text' });

// Compound indexes for sorting and filtering optimization
jobSchema.index({ postedAt: -1 });
jobSchema.index({ company: 1 });
jobSchema.index({ source: 1 });
jobSchema.index({ remote: 1 });
jobSchema.index({ location: 1 });

module.exports = mongoose.model('Job', jobSchema);
