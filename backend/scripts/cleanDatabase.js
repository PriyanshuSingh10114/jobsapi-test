require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const { isUSLocation } = require('../src/utils/locationHelper');

async function cleanDatabase() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  
  const beforeCount = await Job.countDocuments();
  console.log(`Before Count: ${beforeCount}`);

  // Fetch all jobs to re-evaluate their location
  const allJobs = await Job.find({}).lean();
  let deletedCount = 0;

  for (const job of allJobs) {
    const isActuallyUS = isUSLocation(job.location);
    
    // User requested: Delete where isUSJob: false, remote: false. 
    // And also we must fix the Workday "Hi Tech" false positives.
    if (!isActuallyUS && !job.remote) {
      await Job.findByIdAndDelete(job._id);
      deletedCount++;
    } else if (job.isUSJob === false && job.remote === false) {
      // Just in case it's manually stored this way
      await Job.findByIdAndDelete(job._id);
      deletedCount++;
    } else if (job.isUSJob !== isActuallyUS) {
      // Correct the record if it was falsely marked as US
      if (!isActuallyUS) {
         if (!job.remote) {
             await Job.findByIdAndDelete(job._id);
             deletedCount++;
         } else {
             await Job.findByIdAndUpdate(job._id, { isUSJob: false });
         }
      }
    }
  }

  const remainingCount = await Job.countDocuments();
  console.log(`Deleted Count: ${deletedCount}`);
  console.log(`Remaining Count: ${remainingCount}`);

  console.log('\n--- VERIFICATION ---');
  const workdayJobs = await Job.countDocuments({ source: 'Workday' });
  const usJobs = await Job.countDocuments({ isUSJob: true });
  const nonUsJobs = await Job.countDocuments({ isUSJob: false });
  
  console.log(`Total Workday Jobs: ${workdayJobs}`);
  console.log(`US Jobs: ${usJobs}`);
  console.log(`Non-US Jobs: ${nonUsJobs}`);

  process.exit(0);
}

cleanDatabase().catch(console.error);
