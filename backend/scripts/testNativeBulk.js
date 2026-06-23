require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const leverService = require('../src/services/lever.service');
const { generateJobHash } = require('../src/utils/hashHelper');
const { extractSkills, extractExperienceLevel, extractEmploymentType } = require('../src/utils/dataExtractor');

async function testNativeBulk() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  const result = await leverService.fetchJobs();
  const jobs = result.jobs.slice(0, 50); // Get 50 lever jobs
  
  const bulkOps = jobs.map(job => {
    job.jobHash = generateJobHash(job.company, job.title, job.location, job.source);
    
    // Normalize logic
    const fullText = `${job.title || ''} ${job.description || ''}`;
    job.skills = extractSkills(fullText);
    job.experienceLevel = extractExperienceLevel(job.title, job.description, job.experienceLevel);
    job.jobType = extractEmploymentType(job.title, job.description, job.jobType);
    
    return {
      updateOne: {
        filter: { jobHash: job.jobHash },
        update: { $set: job },
        upsert: true
      }
    };
  });
  
  // Use native driver to bypass Mongoose automatic updatedAt!
  const bulkRes = await Job.collection.bulkWrite(bulkOps, { ordered: false });
  console.log(`Native BulkWrite -> matched=${bulkRes.matchedCount}, modified=${bulkRes.modifiedCount}`);
  
  process.exit(0);
}

testNativeBulk().catch(console.error);
