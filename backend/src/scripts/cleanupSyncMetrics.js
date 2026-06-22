require('dotenv').config();
const mongoose = require('mongoose');
const SyncMetric = require('../models/SyncMetric');

async function runCleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas.');

    const totalBefore = await SyncMetric.countDocuments();
    console.log(`Total SyncMetrics before cleanup: ${totalBefore}`);

    // Option: Keep latest 500 records
    const latestMetrics = await SyncMetric.find().sort({ createdAt: -1 }).limit(500).select('_id');
    const latestIds = latestMetrics.map(m => m._id);

    const deleteResult = await SyncMetric.deleteMany({ _id: { $nin: latestIds } });
    console.log(`Cleaned up ${deleteResult.deletedCount} old SyncMetric documents.`);

    console.log('Syncing MongoDB TTL indexes to ensure future automatic cleanup...');
    await SyncMetric.syncIndexes();
    console.log('Indexes synced successfully. Records older than 30 days will auto-delete.');

  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runCleanup();
