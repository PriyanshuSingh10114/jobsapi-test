require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const { buildJobFilter } = require('../src/utils/filterBuilder');

async function testSorting() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  const query = buildJobFilter({});
  
  const jobs = await Job.find(query)
    .sort({ postedAt: -1 })
    .limit(50)
    .select('title company postedAt createdAt source')
    .lean();

  console.log(`Fetched ${jobs.length} jobs with { postedAt: -1 }\n`);

  jobs.forEach((job, index) => {
    console.log(`${index + 1}. [${job.source}] ${job.title} | postedAt: ${job.postedAt} | type: ${typeof job.postedAt} | createdAt: ${job.createdAt}`);
  });

  process.exit(0);
}

testSorting().catch(console.error);
