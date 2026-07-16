const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  portfolio: {
    type: String,
    default: ''
  },
  resumePath: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
