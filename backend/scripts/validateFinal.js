require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

const usFilter = {
  $or: [
    { isUSJob: true },
    { isRemote: true },
    { remote: true }
  ]
};

async function validate() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log('--- STARTING FINAL VALIDATION ---\n');

  // Top Companies
  console.log('--- TOP HIRING COMPANIES (US FILTERED) ---');
  const topCompanies = await Job.aggregate([
    { $match: { company: { $exists: true, $ne: null, $ne: "" }, ...usFilter } },
    { $group: { _id: "$company", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  console.log(JSON.stringify(topCompanies, null, 2), '\n');

  // Top Roles
  console.log('--- MOST IN-DEMAND ROLES (NORMALIZED & US FILTERED) ---');
  const topRoles = await Job.aggregate([
    { $match: { title: { $exists: true, $ne: null, $ne: "" }, ...usFilter } },
    { $project: { titleLower: { $trim: { input: { $toLower: "$title" } } } } },
    { $group: { _id: "$titleLower", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  console.log(JSON.stringify(topRoles, null, 2), '\n');

  // ATS Share
  console.log('--- ATS MARKET SHARE (US FILTERED) ---');
  const atsShare = await Job.aggregate([
    { $match: { source: { $ne: null }, ...usFilter } },
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  console.log(JSON.stringify(atsShare, null, 2), '\n');

  console.log('--- VALIDATION COMPLETE ---');
  process.exit(0);
}

validate().catch(console.error);
