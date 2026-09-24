require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const startCronJobs = require('./cron/syncJobs');

const PORT = process.env.PORT || 5000;

// Connect to database and verify initial jobs presence
connectDB().then(async () => {
  try {
    const Job = require('./models/Job');
    const count = await Job.countDocuments({ is_active: true });
    if (count === 0) {
      logger.info('Database has 0 active jobs. Triggering initial background sync across all ATS sources...');
      const { syncAll } = require('./services/sync.service');
      syncAll().catch(err => logger.error(`Initial background sync failed: ${err.message}`));
    } else {
      logger.info(`Database initialized with ${count} active jobs.`);
    }
  } catch (err) {
    logger.warn(`Could not check initial job count: ${err.message}`);
  }
});

// Start cron jobs
startCronJobs();

app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

