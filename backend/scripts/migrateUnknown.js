require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  const upUnknown = await Job.updateMany({ jobRegion: 'Unknown' }, { $set: { jobRegion: 'Onsite' } });
  const missing = await Job.updateMany({ jobRegion: { $exists: false } }, { $set: { jobRegion: 'Onsite' } });
  
  console.log(`Migrated Unknown to Onsite: ${upUnknown.modifiedCount}`);
  console.log(`Migrated Missing to Onsite: ${missing.modifiedCount}`);

  process.exit(0);
}

migrate().catch(console.error);
