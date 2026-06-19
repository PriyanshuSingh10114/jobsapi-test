const cron = require('node-cron');
const { syncAll } = require('../services/sync.service');
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
  
  logger.info('Cron jobs initialized: Sync scheduled every 6 hours.');
};

module.exports = startCronJobs;
