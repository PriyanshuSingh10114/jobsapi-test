const winston = require('winston');

const isTest = process.env.NODE_ENV === 'test';

const transports = [];

if (isTest) {
  transports.push(new winston.transports.Console({
    silent: true
  }));
} else {
  transports.push(
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  );

  if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports
});

module.exports = logger;
