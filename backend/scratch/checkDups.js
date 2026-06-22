require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const dupsByUrl = await Job.aggregate([
    { $group: { _id: '$applyUrl', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 }, _id: { $ne: null } } }
  ]);
  console.log(`Unique URLs with >1 documents: ${dupsByUrl.length}`);
  
  const dupsByCompanyTitle = await Job.aggregate([
    { $group: { _id: { company: '$company', title: '$title' }, count: { $sum: 1 }, urls: { $addToSet: '$applyUrl' }, locations: { $addToSet: '$location' } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 3 }
  ]);
  console.log(`Example duplicate company+title:`, JSON.stringify(dupsByCompanyTitle, null, 2));

  process.exit(0);
}
run();
