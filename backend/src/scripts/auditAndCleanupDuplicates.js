require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const fs = require('fs');
const path = require('path');

async function runCleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas for Duplicate Audit...');

    const statsBefore = await Job.db.db.command({ collStats: 'jobs' });
    const totalJobsBefore = statsBefore.count;
    
    console.log(`Current Jobs: ${totalJobsBefore}`);
    console.log('Finding historical jobHash duplicates...');

    // Find duplicates grouped by jobHash
    const duplicates = await Job.aggregate([
      { $group: { _id: '$jobHash', count: { $sum: 1 }, docs: { $push: '$$ROOT' } } },
      { $match: { count: { $gt: 1 } } }
    ], { allowDiskUse: true });

    let idsToDelete = [];
    let savedBackup = [];

    duplicates.forEach(dup => {
      // Sort docs by createdAt descending (newest first)
      dup.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Keep the first (newest), collect the rest for deletion
      const toDelete = dup.docs.slice(1);
      toDelete.forEach(doc => {
        idsToDelete.push(doc._id);
        savedBackup.push(doc);
      });
    });

    const duplicatePercentage = totalJobsBefore ? ((idsToDelete.length / totalJobsBefore) * 100).toFixed(2) : 0;
    const avgDocSize = Math.round(statsBefore.avgObjSize || 0);
    const wastedMB = ((idsToDelete.length * avgDocSize) / (1024 * 1024)).toFixed(2);

    console.log('--- Duplicate Diagnostics ---');
    console.log(`Total Duplicates Detected: ${idsToDelete.length}`);
    console.log(`Duplicate Percentage: ${duplicatePercentage}%`);
    console.log(`Wasted Space: ~${wastedMB} MB`);

    if (idsToDelete.length > 0) {
      const backupPath = path.join(process.cwd(), `rollback_duplicates_${Date.now()}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(savedBackup, null, 2));
      console.log(`Backup saved to ${backupPath} for rollback if needed.`);

      console.log('Deleting older duplicates...');
      await Job.deleteMany({ _id: { $in: idsToDelete } });
      console.log('Cleanup successful.');
    } else {
      console.log('No historical duplicates found.');
    }
    
    // Explicitly dropping old applyUrl index if it exists, and making jobHash unique
    console.log('Re-syncing Job indexes...');
    await Job.syncIndexes();
    console.log('Job indexes synchronized.');

    const statsAfter = await Job.db.db.command({ collStats: 'jobs' });
    console.log(`\n--- Verification ---`);
    console.log(`Jobs Before: ${totalJobsBefore}`);
    console.log(`Jobs After: ${statsAfter.count}`);
    console.log(`Successfully purged ${totalJobsBefore - statsAfter.count} documents.`);

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runCleanup();
