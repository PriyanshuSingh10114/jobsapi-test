require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const greenhouseService = require('../src/services/greenhouse.service');
const { generateJobHash } = require('../src/utils/hashHelper');

async function testTimestamps() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  const result = await greenhouseService.fetchJobs();
  const job = result.jobs[0];
  job.jobHash = generateJobHash(job.company, job.title, job.location, job.source);
  
  const bulkRes = await Job.bulkWrite([{
    updateOne: {
      filter: { jobHash: job.jobHash },
      update: { $set: job },
      upsert: true,
      timestamps: false // The magic flag
    }
  }]);
  
  console.log(`BulkWrite with timestamps: false -> matched=${bulkRes.matchedCount}, modified=${bulkRes.modifiedCount}`);
  process.exit(0);
}

testTimestamps().catch(console.error);
