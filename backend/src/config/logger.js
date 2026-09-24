const winston = require('winston');

const isTest = process.env.NODE_ENV === 'test';

const transports = [];

// Custom clean console formatter
const consoleFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  const time = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
  
  // Format log levels with clean symbols and colors
  let levelTag = `[${level.toUpperCase()}]`;
  if (level === 'info') levelTag = `\x1b[32m[INFO]\x1b[0m`;
  else if (level === 'warn') levelTag = `\x1b[33m[WARN]\x1b[0m`;
  else if (level === 'error') levelTag = `\x1b[31m[ERROR]\x1b[0m`;
  else if (level === 'debug') levelTag = `\x1b[36m[DEBUG]\x1b[0m`;

  const logMessage = stack || message;
  return `\x1b[90m${time}\x1b[0m ${levelTag} ${logMessage}`;
});

if (isTest) {
  transports.push(new winston.transports.Console({
    silent: true
  }));
} else {
  transports.push(
    new winston.transports.File({ filename: 'error.log', level: 'error', format: winston.format.combine(winston.format.timestamp(), winston.format.json()) }),
    new winston.transports.File({ filename: 'combined.log', format: winston.format.combine(winston.format.timestamp(), winston.format.json()) })
  );

  if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        consoleFormat
      )
    }));
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports
});

module.exports = logger;

