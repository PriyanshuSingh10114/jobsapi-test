require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log('--- DB AUDIT SCRIPT ---');
  
  // 1. Total jobs
  const totalJobs = await Job.countDocuments({});
  console.log(`Total Jobs: ${totalJobs}\n`);

  // 2. Top Companies
  const topCompaniesAPI = await Job.aggregate([
    { $match: { company: { $exists: true, $ne: null, $ne: "" } } },
    { $group: { _id: "$company", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 }
  ]);
  console.log(`Top Companies API Logic:\n`, JSON.stringify(topCompaniesAPI, null, 2), '\n');
  
  // Checking without match
  const topCompaniesRaw = await Job.aggregate([
    { $group: { _id: "$company", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 }
  ]);
  console.log(`Top Companies Raw:\n`, JSON.stringify(topCompaniesRaw, null, 2), '\n');

  // 3. Most In-Demand Roles
  const topRolesRaw = await Job.aggregate([
    { $group: { _id: "$title", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 }
  ]);
  console.log(`Top Roles Raw:\n`, JSON.stringify(topRolesRaw, null, 2), '\n');

  // 4. Skills
  const sampleSkill = await Job.findOne({ skills: { $exists: true, $not: { $size: 0 } } }, { skills: 1 });
  console.log(`Sample Skills from DB:\n`, sampleSkill, '\n');

  // 5. ATS Market Share
  const atsShare = await Job.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } }
  ]);
  const atsTotal = atsShare.reduce((acc, curr) => acc + curr.count, 0);
  console.log(`ATS Total: ${atsTotal} | DB Total: ${totalJobs}\n`);

  // 6. Hiring Velocity
  const sampleDates = await Job.find({}, { postedAt: 1, createdAt: 1, _id: 0 }).limit(5);
  console.log(`Sample Dates:\n`, sampleDates, '\n');
  
  // 7. Remote Hiring Leaders
  const remoteQuery = await Job.countDocuments({ remote: true });
  const isRemoteQuery = await Job.countDocuments({ isRemote: true });
  console.log(`remote=true: ${remoteQuery} | isRemote=true: ${isRemoteQuery}\n`);

  // 8. Top Hiring States
  const sampleStates = await Job.find({ state: { $ne: null } }, { state: 1, location: 1, isUSJob: 1, _id: 0 }).limit(5);
  console.log(`Sample States:\n`, sampleStates, '\n');
  
  // US Filter check
  const nonUSJobs = await Job.countDocuments({ isUSJob: false });
  const nonUSOnsiteJobs = await Job.countDocuments({ isUSJob: false, remote: false });
  console.log(`Non-US Jobs: ${nonUSJobs} | Non-US Onsite Jobs: ${nonUSOnsiteJobs}\n`);

  process.exit(0);
}

audit().catch(console.error);
