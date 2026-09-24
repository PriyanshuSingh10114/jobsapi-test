const cron = require('node-cron');
const { syncAll } = require('../services/sync.service');
const Job = require('../models/Job');
const RoleTrend = require('../models/RoleTrend');
const logger = require('../config/logger');
const config = require('../config');

let isTrendSnapshotRunning = false;
let isArchiveRunning = false;

/**
 * Sweeps and archives expired jobs based on configured retention days
 */
const archiveExpiredJobs = async () => {
  if (isArchiveRunning) return;
  isArchiveRunning = true;
  try {
    const retentionCutoff = new Date();
    retentionCutoff.setDate(retentionCutoff.getDate() - (config.retentionDays || 30));

    const result = await Job.updateMany(
      { is_active: true, postedAt: { $lt: retentionCutoff } },
      { $set: { is_active: false, expired_at: new Date() } }
    );
    logger.info(`[JobLifecycle] Archived ${result.modifiedCount} expired jobs older than ${config.retentionDays} days`);
  } catch (err) {
    logger.error(`[JobLifecycle] Error during expired jobs cleanup: ${err.message}`);
  } finally {
    isArchiveRunning = false;
  }
};

const startCronJobs = () => {
  // 1. Run sync job every 6 hours (0 0,6,12,18 * * *)
  cron.schedule('0 0,6,12,18 * * *', async () => {
    logger.info('[Scheduler] Running scheduled sync job...');
    try {
      await syncAll();
      logger.info('[Scheduler] Scheduled sync job completed successfully.');
    } catch (error) {
      logger.error(`[Scheduler] Scheduled sync job failed: ${error.message}`);
    }
  });
  
  // 2. Run daily at midnight (0 0 * * *) to snapshot Role Trends and clean up expired jobs
  cron.schedule('0 0 * * *', async () => {
    logger.info('[Scheduler] Running daily RoleTrend snapshot and job lifecycle sweep...');
    
    // Sweep expired jobs
    await archiveExpiredJobs();

    if (isTrendSnapshotRunning) {
      logger.warn('[Scheduler] RoleTrend snapshot already in progress, skipping overlapping run.');
      return;
    }

    isTrendSnapshotRunning = true;
    try {
      const roles = ['Software Engineer', 'Data Scientist', 'ML Engineer', 'DevOps', 'Product Manager', 'Frontend', 'Backend'];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const role of roles) {
        const regex = new RegExp(role, 'i');
        const count = await Job.countDocuments({ title: { $regex: regex }, is_active: true });
        
        await RoleTrend.create({
          role,
          count,
          date: today
        });
      }
      logger.info('[Scheduler] Daily RoleTrend snapshot completed successfully.');
    } catch (error) {
      logger.error(`[Scheduler] Daily RoleTrend snapshot failed: ${error.message}`);
    } finally {
      isTrendSnapshotRunning = false;
    }
  });
  
  logger.info('Cron jobs initialized: Sync scheduled every 6 hours. RoleTrend & Lifecycle scheduled daily.');
};

module.exports = startCronJobs;
