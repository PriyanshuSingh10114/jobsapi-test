require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const { isUSLocation, classifyJobRegion } = require('../src/utils/locationHelper');

async function testLoc() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  console.log(`isUSLocation('Sydney, Australia'): ${isUSLocation('Sydney, Australia')}`);
  console.log(`isUSLocation('Remote - Australia'): ${isUSLocation('Remote - Australia')}`);
  console.log(`isUSLocation('Remote - USA'): ${isUSLocation('Remote - USA')}`);
  
  // Let's see if there are ANY Australia jobs in the DB!
  const aus = await Job.find({ location: { $regex: /australia/i } });
  console.log(`Australia jobs in DB: ${aus.length}`);
  
  if (aus.length > 0) {
    console.log(aus.map(j => ({ id: j._id, loc: j.location, isUSJob: j.isUSJob })));
  }

  process.exit(0);
}

testLoc().catch(console.error);
