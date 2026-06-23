require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const { buildJobFilter } = require('../src/utils/filterBuilder');
const { getRoleRegexPattern } = require('../src/utils/roleNormalizer');

async function testQuality() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log('--- SEARCH QUALITY & EXPIRATION VALIDATION ---\n');

  // 1. Total Jobs Check (Global Expiration)
  const allJobsInDB = await Job.countDocuments({});
  const activeJobs = await Job.countDocuments(buildJobFilter({}));
  console.log(`Total Jobs In DB (Including Expired): ${allJobsInDB}`);
  console.log(`Total Active Jobs (Last 30 Days): ${activeJobs}`);
  console.log(`Jobs Removed from Dashboard/Search: ${allJobsInDB - activeJobs}\n`);

  // 2. Search Relevance Validation
  const role = "Frontend Engineer";
  console.log(`--- RELEVANCE TEST: "${role}" ---`);
  
  const regexPattern = getRoleRegexPattern(role);
  const query = buildJobFilter({ role });

  const pipeline = [
    { $match: query },
    {
      $addFields: {
        relevanceScore: {
          $switch: {
            branches: [
              { case: { $regexMatch: { input: "$title", regex: `^(${regexPattern})$`, options: 'i' } }, then: 100 },
              { case: { $regexMatch: { input: "$title", regex: `^(${regexPattern})`, options: 'i' } }, then: 80 },
              { case: { $regexMatch: { input: "$title", regex: regexPattern, options: 'i' } }, then: 50 }
            ],
            default: 10
          }
        }
      }
    },
    { $sort: { relevanceScore: -1, postedAt: -1 } },
    { $limit: 10 },
    { $project: { title: 1, company: 1, relevanceScore: 1, postedAt: 1, _id: 0 } }
  ];
  
  const jobs = await Job.aggregate(pipeline);
  console.log(JSON.stringify(jobs, null, 2));

  process.exit(0);
}

testQuality().catch(console.error);
