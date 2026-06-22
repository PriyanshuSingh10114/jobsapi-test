require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const fs = require('fs');

async function runAudit() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas.\n');

    // 1. Duplicate Detection by applyUrl
    console.log('--- Duplicate Audit ---');
    const duplicates = await Job.aggregate([
      { $group: { _id: '$applyUrl', count: { $sum: 1 }, jobs: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 }, _id: { $ne: null } } }
    ]);

    let totalDuplicatesToRemove = 0;
    const idsToRemove = [];

    duplicates.forEach(dup => {
      // Keep the first (newest/oldest depending on insertion, usually we want to keep one)
      // We will keep the last one inserted (assuming it's the one with normalized location)
      const toRemove = dup.jobs.slice(0, dup.jobs.length - 1);
      idsToRemove.push(...toRemove);
      totalDuplicatesToRemove += toRemove.length;
    });

    console.log(`Found ${duplicates.length} duplicate applyUrls.`);
    console.log(`Total duplicate documents to remove: ${totalDuplicatesToRemove}`);

    if (idsToRemove.length > 0) {
      console.log('Deleting legacy duplicate documents...');
      await Job.deleteMany({ _id: { $in: idsToRemove } });
      console.log('Deletion complete.\n');
    } else {
      console.log('No duplicates found.\n');
    }

    // 2. Storage Audit
    console.log('--- Storage Audit ---');
    const stats = await Job.db.db.command({ collStats: 'jobs' });
    
    // stats.size is in bytes
    const avgDocSize = Math.round(stats.avgObjSize || 0);
    const collectionSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const indexSizeMB = (stats.totalIndexSize / (1024 * 1024)).toFixed(2);
    const totalJobs = stats.count;

    console.log(`Current Total Jobs: ${totalJobs}`);
    console.log(`Average Document Size: ${avgDocSize} bytes`);
    console.log(`Collection Data Size: ${collectionSizeMB} MB`);
    console.log(`Index Size: ${indexSizeMB} MB\n`);

    // Projections
    console.log('--- Storage Projections ---');
    const estimateMB = (count) => ((count * avgDocSize) / (1024 * 1024)).toFixed(2);
    console.log(`Estimated Storage after 10,000 jobs: ~${estimateMB(10000)} MB`);
    console.log(`Estimated Storage after 50,000 jobs: ~${estimateMB(50000)} MB`);
    console.log(`Estimated Storage after 100,000 jobs: ~${estimateMB(100000)} MB`);
    console.log(`Estimated Storage after 500,000 jobs: ~${estimateMB(500000)} MB\n`);

    // Ensure Unique Index applies
    console.log('--- Index Sync ---');
    console.log('Syncing MongoDB indexes to enforce applyUrl uniqueness...');
    await Job.syncIndexes();
    console.log('Indexes synced successfully.\n');

  } catch (error) {
    console.error('Audit script failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runAudit();
