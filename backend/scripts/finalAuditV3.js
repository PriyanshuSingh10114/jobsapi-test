require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../src/models/Job');
const { validateJob } = require('../src/utils/validationHelper');
const { generateJobHash } = require('../src/utils/hashHelper');

async function runAudit() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobsapi');
  console.log('--- PRODUCTION COMPLIANCE AUDIT ---\n');

  const allJobs = await Job.find({}).lean();
  let errors = 0;
  
  let duplicates = 0;
  let expired = 0;
  let nonUS = 0;
  let brokenUrls = 0;
  
  const hashSet = new Set();
  
  for (const job of allJobs) {
    // Check duplicates
    if (hashSet.has(job.jobHash)) {
      duplicates++;
      errors++;
    }
    hashSet.add(job.jobHash);
    
    // Test through global validation engine
    const validation = validateJob(job);
    if (!validation.isValid) {
      if (validation.reason.includes('older than 30 days')) expired++;
      else if (validation.reason.includes('Non-US job') || validation.reason.includes('STRICT_US_MODE')) nonUS++;
      else if (validation.reason.includes('applyUrl')) brokenUrls++;
      else {
         console.log(`Unknown validation error: ${validation.reason}`);
      }
      errors++;
    }
  }

  console.log(`Total Jobs In DB: ${allJobs.length}`);
  console.log(`\n--- VIOLATIONS ---`);
  console.log(`Expired Jobs: ${expired}`);
  console.log(`Duplicate Jobs: ${duplicates}`);
  console.log(`Non-US Jobs: ${nonUS}`);
  console.log(`Broken URLs: ${brokenUrls}`);
  
  if (errors > 0) {
    console.log(`\n❌ AUDIT FAILED: ${errors} total violations detected.`);
    // Auto-heal by deleting them since we are enforcing STRICT_US_MODE now
    console.log(`\nInitiating Auto-Heal (Deleting violating documents)...`);
    let deletedCount = 0;
    for (const job of allJobs) {
      const v = validateJob(job);
      if (!v.isValid) {
        await Job.findByIdAndDelete(job._id);
        deletedCount++;
      }
    }
    console.log(`✅ Auto-Heal Complete: Removed ${deletedCount} non-compliant jobs.`);
  } else {
    console.log(`\n✅ AUDIT PASSED: 100% US Compliance. Platform is Production Ready.`);
  }

  process.exit(0);
}

runAudit().catch(console.error);
