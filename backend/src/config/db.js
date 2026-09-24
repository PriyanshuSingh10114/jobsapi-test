const mongoose = require('mongoose');
const config = require('./environment');
const logger = require('./logger');

let isConnected = false;

// Attach event listeners
mongoose.connection.on('connected', () => {
  isConnected = true;
  logger.info(`MongoDB Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected. Attempting reconnection...');
});

const connectDB = async (retries = 3, delayMs = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(config.DATABASE.uri, config.DATABASE.options);
      return conn;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        logger.info(`Retrying MongoDB connection in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } else {
        if (config.SERVER.isProduction) {
          logger.error('Fatal: Could not connect to MongoDB in production. Exiting process.');
          process.exit(1);
        }
        logger.warn('MongoDB initial connection could not be established immediately. The app will continue and retry on subsequent requests.');
      }
    }
  }
};

module.exports = connectDB;

