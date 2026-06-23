const cron = require('node-cron');
const { syncAll } = require('../services/sync.service');
const Job = require('../models/Job');
const RoleTrend = require('../models/RoleTrend');
const logger = require('../config/logger');

const startCronJobs = () => {
  // Run every 6 hours (0 0,6,12,18 * * *)
  cron.schedule('0 0,6,12,18 * * *', async () => {
    logger.info('Running scheduled sync job...');
    try {
      await syncAll();
      logger.info('Scheduled sync job completed successfully.');
    } catch (error) {
      logger.error(`Scheduled sync job failed: ${error.message}`);
    }
  });
  
  // Run daily at midnight (0 0 * * *) to snapshot Role Trends
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily RoleTrend snapshot...');
    try {
      const roles = ['Software Engineer', 'Data Scientist', 'ML Engineer', 'DevOps', 'Product Manager', 'Frontend', 'Backend'];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const role of roles) {
        const regex = new RegExp(role, 'i');
        const count = await Job.countDocuments({ title: { $regex: regex } });
        
        await RoleTrend.create({
          role,
          count,
          date: today
        });
      }
      logger.info('Daily RoleTrend snapshot completed successfully.');
    } catch (error) {
      logger.error(`Daily RoleTrend snapshot failed: ${error.message}`);
    }
  });
  
  logger.info('Cron jobs initialized: Sync scheduled every 6 hours. RoleTrend snapshot scheduled daily.');
};

module.exports = startCronJobs;
