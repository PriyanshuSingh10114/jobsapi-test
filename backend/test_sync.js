require('dotenv').config();
const connectDB = require('./src/config/db');
const { syncJobsForSource } = require('./src/services/sync.service');

(async () => {
  await connectDB();
  console.log('Testing Remotive sync...');
  const result = await syncJobsForSource('Remotive');
  console.log('Sync result:', result);
  process.exit(0);
})();
