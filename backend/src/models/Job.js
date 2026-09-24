const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    default: 'Unknown',
    trim: true
  },
  source: {
    type: String,
    required: true,
    trim: true
  },
  applyUrl: {
    type: String,
    required: true,
    trim: true
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
  },
  first_seen: {
    type: Date,
    default: Date.now
  },
  last_seen: {
    type: Date,
    default: Date.now
  },
  is_active: {
    type: Boolean,
    default: true
  },
  expired_at: {
    type: Date
  }
}, { timestamps: true });

// --- PRODUCTION INDEXES & EXPLANATIONS ---

// 1. Text index for full-text search across roles, companies, descriptions, and skills
jobSchema.index({ title: 'text', company: 'text', description: 'text', skills: 'text' });

// 2. Default sorting by posted date
jobSchema.index({ postedAt: -1 });

// 3. Company filtering and sorting
jobSchema.index({ company: 1, postedAt: -1 });

// 4. Source connector filtering and health inspection
jobSchema.index({ source: 1, postedAt: -1 });

// 5. Location filtering
jobSchema.index({ location: 1 });

// 6. Region & Remote filtering
jobSchema.index({ jobRegion: 1, remote: 1, postedAt: -1 });

// 7. Employment type and seniority filtering
jobSchema.index({ jobType: 1, experienceLevel: 1, jobRegion: 1 });

// 8. Primary Query Path Index: Active US jobs sorted by recency
jobSchema.index({ is_active: 1, isUSJob: 1, postedAt: -1 });

// 9. Inactive job sweep and lifecycle freshness index
jobSchema.index({ is_active: 1, last_seen: 1 });

// 10. Partial index for active jobs
jobSchema.index({ is_active: 1, postedAt: -1 }, { partialFilterExpression: { is_active: true } });

module.exports = mongoose.model('Job', jobSchema);
