const mongoose = require('mongoose');
const config = require('./environment');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.DATABASE.uri, config.DATABASE.options);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
