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
  },
  applyUrl: {
    type: String,
    required: true
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
    default: 'Full Time',
  },
  experienceLevel: {
    type: String,
    default: 'Unknown',
  },
  jobRegion: {
    type: String,
    enum: ['Onsite', 'Hybrid', 'Remote', 'Unknown'],
  },
  skills: {
    type: [String],
    default: [],
  },
  salary: {
    min: Number,
    max: Number,
    average: Number,
  },
  state: {
    type: String,
  },
  country: {
    type: String,
  },
  isUSJob: {
    type: Boolean,
    default: false,
  },
  isRemote: {
    type: Boolean,
    default: false,
  },
  jobHash: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

// Text index for search
jobSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' });

// Compound indexes for sorting and filtering optimization
jobSchema.index({ postedAt: -1 });
jobSchema.index({ company: 1 });
jobSchema.index({ source: 1 });
jobSchema.index({ remote: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ jobRegion: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ state: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ isRemote: 1 });
jobSchema.index({ jobRegion: 1, remote: 1, postedAt: -1 });
jobSchema.index({ jobType: 1, experienceLevel: 1, jobRegion: 1 });
jobSchema.index({ source: 1, postedAt: -1 });
jobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
