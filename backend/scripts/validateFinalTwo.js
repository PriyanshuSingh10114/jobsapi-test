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
  console.log('--- FINAL VALIDATION (2 WIDGETS) ---\n');

  // Total Valid US Jobs
  const validJobs = await Job.countDocuments(usFilter);
  console.log(`Total US-First Jobs: ${validJobs}\n`);

  // ATS Share
  console.log('--- ATS MARKET SHARE ---');
  const atsShare = await Job.aggregate([
    { $match: { source: { $ne: null }, ...usFilter } },
    { $group: { _id: "$source", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const sumAts = atsShare.reduce((acc, curr) => acc + curr.count, 0);
  console.log(JSON.stringify(atsShare, null, 2));
  console.log(`\nATS Total: ${sumAts} (Matches Total: ${sumAts === validJobs})\n`);

  // Top States
  console.log('--- TOP HIRING STATES ---');
  const topStates = await Job.aggregate([
    { $match: { state: { $ne: null }, ...usFilter } },
    { $group: { _id: "$state", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  console.log(JSON.stringify(topStates, null, 2), '\n');

  console.log('--- VALIDATION COMPLETE ---');
  process.exit(0);
}

validate().catch(console.error);
