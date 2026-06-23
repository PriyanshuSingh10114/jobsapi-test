require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function validateDB() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  const invalidQuery = { isUSJob: false, remote: false };
  const invalidCount = await Job.countDocuments(invalidQuery);
  console.log(`Phase 1 - Database Validation`);
  console.log(`Total Invalid Jobs (Non-US Onsite): ${invalidCount}`);

  if (invalidCount > 0) {
    const samples = await Job.find(invalidQuery).limit(10).select('title company location isUSJob remote source');
    console.log(`\nSample Invalid Jobs:`);
    console.log(JSON.stringify(samples, null, 2));
  }
  
  process.exit(0);
}

validateDB().catch(console.error);
