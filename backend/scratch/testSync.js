require('dotenv').config();
const mongoose = require('mongoose');
const { syncJobsForSource } = require('../src/services/sync.service');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log("Running USAJobs sync...");
  let res1 = await syncJobsForSource('USAJobs');
  console.log(res1);

  process.exit(0);
}
run();
