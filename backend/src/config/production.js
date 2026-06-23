module.exports = {
  retentionDays: parseInt(process.env.JOB_RETENTION_DAYS, 10) || 30,
  syncIntervalHours: parseInt(process.env.SYNC_INTERVAL_HOURS, 10) || 6,
  strictUSMode: true // Force strict mode in production regardless of env, or rely on env. Following spec: strictUSMode: true
};
