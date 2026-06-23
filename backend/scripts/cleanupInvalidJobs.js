require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  const invalidQuery = { isUSJob: false, remote: false };
  const beforeCount = await Job.countDocuments({});
  const invalidCount = await Job.countDocuments(invalidQuery);
  
  console.log(`--- DB CLEANUP INITIATED ---`);
  console.log(`Total Jobs Before: ${beforeCount}`);
  console.log(`Invalid Non-US Onsite Jobs to Delete: ${invalidCount}`);

  if (invalidCount > 0) {
    const result = await Job.deleteMany(invalidQuery);
    console.log(`Successfully Deleted: ${result.deletedCount} jobs.`);
  } else {
    console.log(`No invalid jobs found. Skip delete.`);
  }

  const afterCount = await Job.countDocuments({});
  console.log(`Total Jobs After: ${afterCount}`);

  process.exit(0);
}

cleanup().catch(console.error);
