const mongoose = require('mongoose');

const roleTrendSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  }
}, { timestamps: true });

// Compound index for querying specific roles by date
roleTrendSchema.index({ role: 1, date: -1 });

module.exports = mongoose.model('RoleTrend', roleTrendSchema);
