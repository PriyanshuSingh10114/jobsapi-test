require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const startCronJobs = require('./cron/syncJobs');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Start cron jobs
startCronJobs();

app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
