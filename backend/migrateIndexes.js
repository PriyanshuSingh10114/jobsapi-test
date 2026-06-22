const mongoose = require('mongoose');
const Job = require('./src/models/Job');
const { generateJobHash } = require('./src/utils/hashHelper');

const migrate = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/job-source-tester');
    console.log('Connected to DB');
    
    try {
      await Job.collection.dropIndex('applyUrl_1');
      console.log('Dropped applyUrl_1');
    } catch (e) { console.log('Index applyUrl_1 does not exist'); }
    
    try {
      await Job.collection.dropIndex('applyUrl_1_source_1');
      console.log('Dropped applyUrl_1_source_1');
    } catch (e) { console.log('Index applyUrl_1_source_1 does not exist'); }

    const jobs = await Job.find({});
    let count = 0;
    let deletedCount = 0;
    const seenHashes = new Set();
    
    for (const job of jobs) {
      const hash = generateJobHash(job.company, job.title, job.location, job.source);
      
      if (seenHashes.has(hash)) {
        await Job.deleteOne({ _id: job._id });
        deletedCount++;
        continue;
      }
      
      seenHashes.add(hash);
      
      if (!job.jobHash || job.jobHash !== hash) {
        job.jobHash = hash;
        await job.save();
        count++;
      }
    }
    console.log(`Migrated ${count} jobs with jobHash, deleted ${deletedCount} duplicates`);
    
    await Job.syncIndexes();
    console.log('Synced indexes');

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
migrate();
