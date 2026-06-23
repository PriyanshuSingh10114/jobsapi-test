require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const { buildJobFilter } = require('../src/utils/filterBuilder');

const formatDistanceToNow = (dateStr) => {
  const diff = new Date() - new Date(dateStr);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return `1 day ago`;
  return `${days} days ago`;
};

async function testSorting() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log('--- STRICT CHRONOLOGICAL SORTING VALIDATION ---\n');

  const query = buildJobFilter({ role: 'Engineer' }); // Simulated Search

  // Simulated 'Newest First' selection (strictly chronological)
  const sortOption = { postedAt: -1 };
  
  const jobs = await Job.aggregate([
    { $match: query },
    { $sort: sortOption },
    { $limit: 15 },
    { $project: { title: 1, postedAt: 1, _id: 0 } }
  ]);

  console.log('Results for "Newest First" (Chronological Output):');
  let valid = true;
  for (let i = 0; i < jobs.length; i++) {
    const isNewer = i === 0 || new Date(jobs[i-1].postedAt) >= new Date(jobs[i].postedAt);
    if (!isNewer) valid = false;
    
    console.log(`${String(i+1).padStart(2, ' ')}. ${formatDistanceToNow(jobs[i].postedAt).padEnd(12, ' ')} | ${jobs[i].postedAt.toISOString()} | ${jobs[i].title}`);
  }

  console.log(`\nValidation Pass (Strict Descending Order): ${valid}`);

  process.exit(0);
}

testSorting().catch(console.error);
