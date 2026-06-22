require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const dups = await Job.aggregate([
    { $group: { _id: '$jobHash', count: { $sum: 1 }, jobs: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } }
  ]);
  console.log('Duplicates count:', dups.length);
  let duplicateDocs = 0;
  dups.forEach(d => {
    duplicateDocs += (d.count - 1);
  });
  console.log('Wasted space (docs):', duplicateDocs);
  process.exit(0);
}
run();
