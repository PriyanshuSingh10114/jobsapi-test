require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function validate() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log('--- STARTING VALIDATION ---\n');

  // 1. Top Hiring Companies
  console.log('--- TOP HIRING COMPANIES ---');
  const topCompanies = await Job.aggregate([
    { $match: { company: { $exists: true, $ne: null, $ne: "" } } },
    { $group: { _id: "$company", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  const mappedCompanies = topCompanies.map(c => ({ company: c._id, count: c.count }));
  console.log(JSON.stringify(mappedCompanies, null, 2));
  console.log('');

  // 2. Most In-Demand Roles
  console.log('--- MOST IN-DEMAND ROLES ---');
  const topRoles = await Job.aggregate([
    { $match: { title: { $exists: true, $ne: null, $ne: "" } } },
    { $group: { _id: "$title", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  const mappedRoles = topRoles.map(r => ({ title: r._id, count: r.count }));
  console.log(JSON.stringify(mappedRoles, null, 2));
  console.log('');

  // 3. ATS Market Share Verification
  console.log('--- ATS MARKET SHARE ---');
  const atsShare = await Job.aggregate([
    { $match: { source: { $ne: null } } },
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const mappedSources = atsShare.map(s => ({ source: s._id, count: s.count }));
  console.log(JSON.stringify(mappedSources, null, 2));
  console.log('');

  console.log('\n--- VALIDATION COMPLETE ---');
  process.exit(0);
}

validate().catch(err => {
  console.error(err);
  process.exit(1);
});
