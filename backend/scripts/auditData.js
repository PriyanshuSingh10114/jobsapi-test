require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const { buildJobFilter } = require('../src/utils/filterBuilder');

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  console.log('--- PHASE 1: JOB COUNT DISCREPANCY ---');
  const rawCount = await Job.countDocuments({});
  console.log(`Raw Mongo Count: ${rawCount}`);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const ageCount = await Job.countDocuments({ postedAt: { $gte: thirtyDaysAgo } });
  console.log(`After Age Filter: ${ageCount}`);
  
  const usCount = await Job.countDocuments({ 
    postedAt: { $gte: thirtyDaysAgo },
    isUSJob: true 
  });
  console.log(`After US Filter (Only): ${usCount}`);
  
  const remoteCount = await Job.countDocuments({ 
    postedAt: { $gte: thirtyDaysAgo },
    remote: true 
  });
  console.log(`After Remote Filter (Only): ${remoteCount}`);
  
  const usOrRemoteCount = await Job.countDocuments({ 
    postedAt: { $gte: thirtyDaysAgo },
    $or: [{ isUSJob: true }, { remote: true }] 
  });
  console.log(`After US OR Remote Filter: ${usOrRemoteCount}`);
  
  const apiFilter = buildJobFilter({});
  const apiCount = await Job.countDocuments(apiFilter);
  console.log(`Final Search Count (buildJobFilter): ${apiCount}`);
  
  console.log('\n--- PHASE 5: DATA QUALITY REPORT ---');
  const missingLocation = await Job.countDocuments({ $or: [{ location: null }, { location: 'Unknown' }] });
  const missingCompany = await Job.countDocuments({ $or: [{ company: null }, { company: '' }] });
  const missingApplyUrl = await Job.countDocuments({ $or: [{ applyUrl: null }, { applyUrl: '' }] });
  const missingPostedDate = await Job.countDocuments({ postedAt: null });
  const missingJobType = await Job.countDocuments({ $or: [{ jobType: null }, { jobType: 'Unknown' }] });
  const missingExp = await Job.countDocuments({ $or: [{ experienceLevel: null }, { experienceLevel: 'Unknown' }] });
  
  console.log(`Jobs Missing Location: ${missingLocation}`);
  console.log(`Jobs Missing Company: ${missingCompany}`);
  console.log(`Jobs Missing Apply URL: ${missingApplyUrl}`);
  console.log(`Jobs Missing Posted Date: ${missingPostedDate}`);
  console.log(`Jobs Missing Job Type: ${missingJobType}`);
  console.log(`Jobs Missing Experience Level: ${missingExp}`);

  process.exit(0);
}

audit().catch(console.error);
