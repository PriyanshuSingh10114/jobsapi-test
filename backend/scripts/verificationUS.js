require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log(`--- US-ONLY VERIFICATION REPORT ---\n`);

  // Total Jobs Before Cleanup is 5532, Total Jobs Deleted is 1115
  // We can fetch remaining directly
  const totalRemaining = await Job.countDocuments({});
  console.log(`Total US Jobs Remaining: ${totalRemaining}`);

  const remote = await Job.countDocuments({ jobRegion: 'Remote' });
  console.log(`Total Remote Jobs: ${remote}`);

  const hybrid = await Job.countDocuments({ jobRegion: 'Hybrid' });
  console.log(`Total Hybrid Jobs: ${hybrid}`);

  const onsite = await Job.countDocuments({ jobRegion: 'Onsite' });
  console.log(`Total Onsite Jobs: ${onsite}`);

  process.exit(0);
}

verify().catch(console.error);
