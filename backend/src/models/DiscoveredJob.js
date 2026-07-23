const mongoose = require('mongoose');

const discoveredJobSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  companyName: { type: String, required: true, index: true },
  location: { type: String, default: 'Remote' },
  applyUrl: { type: String, required: true, unique: true },
  atsKey: { type: String, default: 'generic', index: true },
  atsName: { type: String, default: 'Generic ATS' },
  dedupHash: { type: String, required: true, unique: true, index: true },
  
  description: { type: String, default: '' },
  requirements: [{ type: String }],
  salaryRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' }
  },
  
  isRemote: { type: Boolean, default: false },
  techStack: [{ type: String }],
  matchScore: { type: Number, default: 0 },
  
  status: {
    type: String,
    enum: ['Discovered', 'Queued', 'Applied', 'Skipped', 'Failed'],
    default: 'Discovered',
    index: true
  },
  
  discoveredAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('DiscoveredJob', discoveredJobSchema);
