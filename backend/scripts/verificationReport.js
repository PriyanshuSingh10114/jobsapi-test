require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log(`--- PHASE 9: VERIFICATION REPORT ---\n`);

  const total = await Job.countDocuments();
  console.log(`Total Jobs After Cleanup: ${total}`);

  const invalid = await Job.countDocuments({ isUSJob: false, remote: false });
  console.log(`Invalid Non-US Onsite Jobs Remaining: ${invalid}`);

  const internships = await Job.countDocuments({ 
    $or: [
      { jobType: 'Internship' },
      { experienceLevel: 'Internship' }
    ] 
  });
  console.log(`Internships Detected: ${internships}`);

  const usJobs = await Job.countDocuments({ isUSJob: true });
  console.log(`Total US Jobs (Onsite + Hybrid + Remote): ${usJobs}`);

  const usRemote = await Job.countDocuments({ isUSJob: true, remote: true });
  console.log(`Total US Remote Jobs: ${usRemote}`);

  const intlRemote = await Job.countDocuments({ isUSJob: false, remote: true });
  console.log(`Total International Remote Jobs: ${intlRemote}`);

  process.exit(0);
}

verify().catch(console.error);
