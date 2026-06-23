require('dotenv').config();
const mongoose = require('mongoose');
const { syncAll } = require('../src/services/sync.service');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log('Starting massive V2 Sync...');
  
  const result = await syncAll();
  console.log('Sync Result:');
  console.log(JSON.stringify(result, null, 2));
  
  process.exit(0);
}

run().catch(console.error);
