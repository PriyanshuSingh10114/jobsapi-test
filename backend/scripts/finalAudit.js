require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const { buildJobFilter } = require('../src/utils/filterBuilder');

async function audit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log('======================================================');
  console.log('PHASE 2 – DATABASE VERIFICATION');
  console.log('======================================================');
  
  const nonUsCount = await Job.countDocuments({ isUSJob: false });
  console.log(`db.jobs.countDocuments({ isUSJob: false }) = ${nonUsCount}`);
  
  const sample = await Job.find({ isUSJob: false }, { title: 1, company: 1, location: 1, remote: 1, jobRegion: 1 }).limit(20);
  console.log('Sample Records:');
  console.log(JSON.stringify(sample, null, 2));

  console.log('\n======================================================');
  console.log('PHASE 6 – COUNT MISMATCH INVESTIGATION');
  console.log('======================================================');
  
  const dbTotal = await Job.countDocuments({});
  console.log(`Database Total = ${dbTotal}`);
  
  const apiFilter = buildJobFilter({});
  const searchableTotal = await Job.countDocuments(apiFilter);
  console.log(`Dashboard Total (Searchable) = ${searchableTotal}`);
  
  const difference = dbTotal - searchableTotal;
  console.log(`Difference = ${difference}`);
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const expiredJobs = await Job.countDocuments({ postedAt: { $lt: thirtyDaysAgo } });
  console.log(`- Expired (>30 days) jobs: ${expiredJobs}`);
  
  const missingPostedAt = await Job.countDocuments({ postedAt: null });
  console.log(`- Missing postedAt: ${missingPostedAt}`);
  
  const missingApplyUrl = await Job.countDocuments({ applyUrl: null });
  console.log(`- Missing applyUrl: ${missingApplyUrl}`);
  
  const invalidLocations = await Job.countDocuments({ isUSJob: false });
  console.log(`- Invalid locations (isUSJob: false): ${invalidLocations}`);

  console.log('\n======================================================');
  console.log('PHASE 7 – FINAL VERIFICATION REPORT');
  console.log('======================================================');
  
  const usOnsite = await Job.countDocuments({ jobRegion: 'Onsite' });
  const usHybrid = await Job.countDocuments({ jobRegion: 'Hybrid' });
  const usRemote = await Job.countDocuments({ jobRegion: 'Remote' });
  const intlRemaining = nonUsCount;
  
  console.log(`Total Database Jobs: ${dbTotal}`);
  console.log(`Total Searchable Jobs: ${searchableTotal}`);
  console.log(`US Onsite: ${usOnsite}`);
  console.log(`US Hybrid: ${usHybrid}`);
  console.log(`US Remote: ${usRemote}`);
  console.log(`International Jobs Remaining: ${intlRemaining}`);

  process.exit(0);
}

audit().catch(console.error);
