require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function checkSkills() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  const totalJobs = await Job.countDocuments({});
  const jobsWithSkills = await Job.countDocuments({ skills: { $exists: true, $type: 'array', $ne: [] } });
  
  console.log(`Total: ${totalJobs}`);
  console.log(`With Skills: ${jobsWithSkills}`);
  console.log(`Coverage: ${((jobsWithSkills/totalJobs)*100).toFixed(2)}%`);
  
  process.exit(0);
}

checkSkills().catch(console.error);
