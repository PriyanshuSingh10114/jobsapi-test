require('dotenv').config();
const mongoose = require('mongoose');
const { AutomationWorkerQueue } = require('./src/automation/workers/AutomationWorkerQueue');
const connectDB = require('./src/config/db');
const Job = require('./src/models/Job');

async function run() {
  await connectDB();
  const job = await Job.findOne({ source: 'Greenhouse' });
  if (!job) {
    console.error('No Greenhouse job found');
    process.exit(1);
  }
  
  const profileData = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '555-555-5555',
    resume: 'e:/TM/jobsapi/backend/package.json'
  };
  
  const session = await AutomationWorkerQueue.enqueueJob(job._id, 'local_admin_1', 'Greenhouse', profileData);
  console.log('Enqueued job with session:', session._id.toString());
  process.exit(0);
}

run();
