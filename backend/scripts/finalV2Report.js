require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const Source = require('../src/models/Source');

async function generateReport() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log('--- JOBSEARCH V2 FINAL VERIFICATION REPORT ---\n');

  const totalJobs = await Job.countDocuments();
  console.log(`Total Active Verified Jobs: ${totalJobs}`);

  const totalCompanies = (await Job.distinct('company')).length;
  console.log(`Total Verified Companies: ${totalCompanies}`);

  const byRegion = await Job.aggregate([
    { $group: { _id: "$jobRegion", count: { $sum: 1 } } }
  ]);
  console.log('\n--- BY REGION ---');
  byRegion.forEach(r => console.log(`${r._id}: ${r.count}`));

  const bySource = await Job.aggregate([
    { $group: { _id: "$source", count: { $sum: 1 } } }
  ]);
  console.log('\n--- BY ATS SOURCE ---');
  bySource.forEach(r => console.log(`${r._id}: ${r.count}`));

  const internships = await Job.countDocuments({ experienceLevel: 'Internship' });
  console.log(`\n--- JUNIOR ROLES ---`);
  console.log(`Total Internships: ${internships}`);

  const isUS = await Job.countDocuments({ isUSJob: true });
  console.log(`\n--- US COMPLIANCE ---`);
  console.log(`US-Verified Jobs: ${isUS} (${((isUS/totalJobs)*100).toFixed(2)}%)`);

  process.exit(0);
}

generateReport().catch(console.error);
