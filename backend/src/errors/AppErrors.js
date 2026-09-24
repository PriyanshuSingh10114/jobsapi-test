/**
 * Standardized Typed Application Error Hierarchy for JobsAPI
 */

class AppError extends Error {
  constructor(message, code = 'INTERNAL_SERVER_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 'AUTHENTICATION_REQUIRED', 401, details);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Permission denied', details = null) {
    super(message, 'PERMISSION_DENIED', 403, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = null) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict or duplicate entry', details = null) {
    super(message, 'RESOURCE_CONFLICT', 409, details);
  }
}

class ExternalServiceError extends AppError {
  constructor(message = 'External service request failed', details = null) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, details);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details = null) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

class QueueError extends AppError {
  constructor(message = 'Queue operation failed', details = null) {
    super(message, 'QUEUE_ERROR', 500, details);
  }
}

class AutomationError extends AppError {
  constructor(message = 'Automation workflow failed', details = null) {
    super(message, 'AUTOMATION_ERROR', 500, details);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded. Please try again later.', details = null) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ExternalServiceError,
  DatabaseError,
  QueueError,
  AutomationError,
  RateLimitError
};
