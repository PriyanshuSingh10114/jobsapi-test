require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function testSearch() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  const searchStr = 'Frontend Engineer';
  const roleAliases = ['frontend', 'front end', 'react', 'ui engineer'];
  const regexPattern = roleAliases.join('|');
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const pipeline = [
    { 
      $match: { 
        postedAt: { $gte: thirtyDaysAgo },
        $or: [
          { title: { $regex: regexPattern, $options: 'i' } },
          { description: { $regex: regexPattern, $options: 'i' } }
        ]
      } 
    },
    {
      $addFields: {
        relevanceScore: {
          $switch: {
            branches: [
              { case: { $regexMatch: { input: "$title", regex: `^(${regexPattern})$`, options: 'i' } }, then: 100 },
              { case: { $regexMatch: { input: "$title", regex: `^(${regexPattern})`, options: 'i' } }, then: 80 },
              { case: { $regexMatch: { input: "$title", regex: regexPattern, options: 'i' } }, then: 50 }
            ],
            default: 10 // description match
          }
        }
      }
    },
    { $sort: { relevanceScore: -1, postedAt: -1 } },
    { $limit: 10 },
    { $project: { title: 1, company: 1, relevanceScore: 1, postedAt: 1, _id: 0 } }
  ];

  const results = await Job.aggregate(pipeline);
  console.log(`Results for "${searchStr}":\n`, JSON.stringify(results, null, 2));

  process.exit(0);
}

testSearch().catch(console.error);
