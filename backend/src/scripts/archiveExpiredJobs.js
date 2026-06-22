require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');

async function runArchive() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas for Job Archival...');

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    console.log(`Deleting jobs posted before: ${ninetyDaysAgo.toISOString()}`);

    // If you want to actually archive to another collection, you would insertMany into ArchiveJob first.
    // Here we will just perform the deletion to prevent infinite growth.
    const result = await Job.deleteMany({ postedAt: { $lt: ninetyDaysAgo } });

    console.log(`Successfully removed ${result.deletedCount} expired jobs from the primary collection.`);

  } catch (err) {
    console.error('Archival failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runArchive();
