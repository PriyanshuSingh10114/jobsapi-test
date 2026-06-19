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
    enum: ['Arbeitnow', 'Remotive', 'Greenhouse', 'Lever', 'Ashby'],
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
}, { timestamps: true });

// Create a compound index to help with deduplication just in case
jobSchema.index({ applyUrl: 1, source: 1 }, { unique: true });

module.exports = mongoose.model('Job', jobSchema);
