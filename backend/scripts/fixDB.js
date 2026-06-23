require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const { isUSLocation } = require('../src/utils/locationHelper');

async function fixDB() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  // Find all jobs that shouldn't be US jobs
  const allJobs = await Job.find({ isUSJob: true });
  let deletedCount = 0;
  
  for (const job of allJobs) {
    if (!isUSLocation(job.location)) {
      await Job.deleteOne({ _id: job._id });
      deletedCount++;
    }
  }
  
  console.log(`Deleted ${deletedCount} fake US jobs (like Australia).`);
  process.exit(0);
}

fixDB().catch(console.error);
