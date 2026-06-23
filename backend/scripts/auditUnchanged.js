require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const greenhouseService = require('../src/services/greenhouse.service');
const { generateJobHash } = require('../src/utils/hashHelper');

async function testUpdates() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  console.log('Fetching Greenhouse jobs...');
  const result = await greenhouseService.fetchJobs();
  const jobs = result.jobs.slice(0, 50); // Test first 50
  
  for (let job of jobs) {
    job.jobHash = generateJobHash(job.company, job.title, job.location, job.source);
    const existing = await Job.findOne({ jobHash: job.jobHash }).lean();
    
    if (existing) {
      console.log(`Found existing job: ${job.title} at ${job.company}`);
      const changes = [];
      // Compare fields
      if (existing.title !== job.title) changes.push('title');
      if (existing.company !== job.company) changes.push('company');
      if (existing.applyUrl !== job.applyUrl) changes.push('applyUrl');
      
      // Compare dates
      const oldDate = existing.postedAt ? new Date(existing.postedAt).getTime() : null;
      const newDate = job.postedAt ? new Date(job.postedAt).getTime() : null;
      if (oldDate !== newDate) {
        changes.push(`postedAt (old: ${oldDate}, new: ${newDate})`);
      }
      
      if (changes.length > 0) {
        console.log(`  -> Changes detected: ${changes.join(', ')}`);
      } else {
        console.log(`  -> No fundamental changes.`);
        // Try a manual bulkWrite update to see if modifiedCount increments
        const bulkRes = await Job.bulkWrite([{
          updateOne: {
            filter: { jobHash: job.jobHash },
            update: { $set: job },
            upsert: true
          }
        }]);
        console.log(`  -> BulkWrite result: matched=${bulkRes.matchedCount}, modified=${bulkRes.modifiedCount}`);
      }
    }
  }
  process.exit(0);
}

testUpdates().catch(console.error);
