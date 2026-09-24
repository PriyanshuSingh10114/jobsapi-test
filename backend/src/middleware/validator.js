const { ValidationError } = require('../errors/AppErrors');
const mongoose = require('mongoose');

/**
 * Higher-order request validation middleware
 */
const validate = (schemaFn, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source] || {};
      const errors = schemaFn(data);
      if (errors && Object.keys(errors).length > 0) {
        return next(new ValidationError('Invalid request payload', errors));
      }
      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Validates MongoDB ObjectId in route params
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new ValidationError(`Invalid identifier format for parameter '${paramName}'`, {
        [paramName]: 'Must be a valid 24-character hexadecimal MongoDB ObjectId'
      }));
    }
    next();
  };
};

/**
 * Validation Schemas
 */
const schemas = {
  automationStart: (body) => {
    const errors = {};
    if (!body.jobId || !mongoose.Types.ObjectId.isValid(body.jobId)) {
      errors.jobId = 'Valid MongoDB jobId is required';
    }
    if (!body.userId || typeof body.userId !== 'string' || body.userId.trim() === '') {
      errors.userId = 'userId string is required';
    }
    if (!body.connectorName || typeof body.connectorName !== 'string') {
      errors.connectorName = 'connectorName string is required';
    }
    return errors;
  },

  discoveryIngest: (body) => {
    const errors = {};
    if (!body.jobs || !Array.isArray(body.jobs) || body.jobs.length === 0) {
      errors.jobs = 'Body must contain a non-empty array of "jobs"';
    } else if (body.jobs.length > 500) {
      errors.jobs = 'Maximum batch size for job discovery is 500 records';
    }
    return errors;
  },

  autoApplyRun: (body) => {
    const errors = {};
    if (!body.userId || typeof body.userId !== 'string') {
      errors.userId = 'userId is required';
    }
    if (body.minScore !== undefined && (isNaN(body.minScore) || body.minScore < 0 || body.minScore > 100)) {
      errors.minScore = 'minScore must be a number between 0 and 100';
    }
    if (body.limit !== undefined && (isNaN(body.limit) || body.limit < 1 || body.limit > 50)) {
      errors.limit = 'limit must be a number between 1 and 50';
    }
    return errors;
  },

  profileUpdate: (body) => {
    const errors = {};
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
      errors.body = 'Request body cannot be empty';
    }
    return errors;
  }
};

module.exports = {
  validate,
  validateObjectId,
  schemas
};
