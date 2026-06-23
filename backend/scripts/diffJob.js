require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const greenhouseService = require('../src/services/greenhouse.service');
const { generateJobHash } = require('../src/utils/hashHelper');
const { extractSkills, extractSalary, extractState, extractExperienceLevel, extractEmploymentType } = require('../src/utils/dataExtractor');

async function diffJob() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  const result = await greenhouseService.fetchJobs();
  const job = result.jobs[0];
  const fullText = `${job.title || ''} ${job.description || ''}`;
  job.skills = extractSkills(fullText);
  job.experienceLevel = extractExperienceLevel(job.title, job.description, job.experienceLevel);
  job.jobType = extractEmploymentType(job.title, job.description, job.jobType);
  job.jobHash = generateJobHash(job.company, job.title, job.location, job.source);
  
  const existing = await Job.findOne({ jobHash: job.jobHash }).lean();
  
  const keys = Object.keys(job);
  for (const k of keys) {
    if (k === 'postedAt') {
      if (new Date(existing[k]).getTime() !== new Date(job[k]).getTime()) {
        console.log(`DIFF -> postedAt: DB=${existing[k]} | NEW=${job[k]}`);
      }
    } else if (JSON.stringify(existing[k]) !== JSON.stringify(job[k])) {
      console.log(`DIFF -> ${k}:\nDB=${JSON.stringify(existing[k])}\nNEW=${JSON.stringify(job[k])}`);
    }
  }

  process.exit(0);
}

diffJob().catch(console.error);
