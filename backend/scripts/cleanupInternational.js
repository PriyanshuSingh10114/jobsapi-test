require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log(`--- CRITICAL LOCATION CLASSIFICATION CLEANUP ---`);
  
  const beforeCount = await Job.countDocuments({});
  console.log(`Total Jobs Before: ${beforeCount}`);

  // 1. Delete all non-US jobs
  const delResult = await Job.deleteMany({ isUSJob: false });
  console.log(`Deleted ${delResult.deletedCount} non-US jobs.`);

  // 2. Migrate jobRegion values
  const upOnsite = await Job.updateMany({ jobRegion: 'US Onsite' }, { $set: { jobRegion: 'Onsite' } });
  const upHybrid = await Job.updateMany({ jobRegion: 'US Hybrid' }, { $set: { jobRegion: 'Hybrid' } });
  const upRemote = await Job.updateMany({ jobRegion: 'US Remote' }, { $set: { jobRegion: 'Remote' } });
  
  console.log(`Migrated Onsite: ${upOnsite.modifiedCount}`);
  console.log(`Migrated Hybrid: ${upHybrid.modifiedCount}`);
  console.log(`Migrated Remote: ${upRemote.modifiedCount}`);

  const remaining = await Job.countDocuments({});
  console.log(`Total Jobs Remaining: ${remaining}`);

  process.exit(0);
}

cleanup().catch(console.error);
