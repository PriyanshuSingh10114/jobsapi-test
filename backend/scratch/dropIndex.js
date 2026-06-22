require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    await Job.collection.dropIndex('jobHash_1');
    console.log('Successfully dropped jobHash_1 index');
  } catch (e) {
    console.log('Error dropping index (may not exist):', e.message);
  }
  process.exit(0);
}
run();
