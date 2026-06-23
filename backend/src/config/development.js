module.exports = {
  retentionDays: parseInt(process.env.JOB_RETENTION_DAYS, 10) || 30,
  syncIntervalHours: parseInt(process.env.SYNC_INTERVAL_HOURS, 10) || 6,
  strictUSMode: process.env.STRICT_US_MODE === 'true' ? true : false
};
