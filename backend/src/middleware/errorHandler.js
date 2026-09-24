const logger = require('../config/logger');
const { AppError } = require('../errors/AppErrors');
const config = require('../config');

/**
 * Centralized Production-Ready Express Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  const requestId = req.id || 'N/A';
  let statusCode = err.statusCode || err.status || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || null;

  // Handle Specific Library Errors
  // 1. Mongoose Validation Error
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Database validation failed';
    details = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
  }

  // 2. Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'RESOURCE_CONFLICT';
    message = 'A resource with this identifier already exists';
    details = err.keyValue;
  }

  // 3. Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_IDENTIFIER';
    message = `Invalid format for field '${err.path}'`;
    details = { path: err.path, value: err.value };
  }

  // 4. Multer Upload Errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    errorCode = 'FILE_UPLOAD_ERROR';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = `File exceeds maximum allowed size of ${config.STORAGE.maxFileSizeMb}MB`;
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  // 5. JSON Syntax Parse Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    errorCode = 'MALFORMED_JSON';
    message = 'Invalid JSON payload received';
  }

  // Log Error Details
  if (statusCode >= 500) {
    logger.error(`[${requestId}] ${req.method} ${req.url} - ${statusCode} - ${message}`, {
      stack: err.stack,
      errorCode,
      details
    });
  } else {
    logger.warn(`[${requestId}] ${req.method} ${req.url} - ${statusCode} - ${message}`);
  }

  const responsePayload = {
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(details ? { details } : {})
    },
    requestId
  };

  // Only include stack trace in development or test
  if (!config.SERVER.isProduction && err.stack) {
    responsePayload.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
