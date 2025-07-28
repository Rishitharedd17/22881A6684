const { logger } = require('./logger');

// 404 handler - for routes that don't exist
const notFoundHandler = (req, res, next) => {
  logger.warn('Route not found', {
    requestId: req.requestId,
    method: req.method,
    url: req.url
  });

  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
  logger.error('Global error handler triggered', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors,
      timestamp: new Date().toISOString()
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    return res.status(409).json({
      error: 'Conflict',
      message: `${field} '${value}' already exists`,
      timestamp: new Date().toISOString()
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Token expired',
      timestamp: new Date().toISOString()
    });
  }

  // SyntaxError (usually from malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON format',
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Don't leak error details in production
  const errorResponse = {
    error: statusCode >= 500 ? 'Internal Server Error' : 'Error',
    message: statusCode >= 500 && process.env.NODE_ENV === 'production' 
      ? 'Something went wrong on our end' 
      : message,
    timestamp: new Date().toISOString()
  };

  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = {
      stack: err.stack,
      name: err.name
    };
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper - catches async errors and passes them to error handler
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
  asyncHandler
};
