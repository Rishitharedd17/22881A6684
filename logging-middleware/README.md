# Logging Middleware Package

A comprehensive, reusable logging middleware that integrates with test servers and provides extensive logging capabilities for Node.js and browser applications.

## Features

- **Reusable Log Function**: Implements the required `Log(stack, level, package, message)` structure
- **Test Server Integration**: Automatically sends logs to configured test server endpoints
- **Multiple Log Levels**: Debug, Info, Warn, Error, Fatal
- **Batch Processing**: Efficient batching of log entries to reduce API calls
- **Retry Mechanism**: Automatic retry with exponential backoff for failed requests
- **Environment Detection**: Automatic detection of Node.js vs browser environments
- **Express Middleware**: Ready-to-use Express middleware for request/response logging
- **Local Storage**: Browser-compatible local log storage
- **Process Information**: Automatic capture of Node.js process information
- **Request Tracking**: Unique request ID generation and tracking

## Installation

```bash
npm install @url-shortener/logging-middleware
```

## Quick Start

```javascript
const { createLogger } = require('@url-shortener/logging-middleware');

// Initialize the logger
const logger = createLogger({
  testServerUrl: 'https://your-test-server.com/api',
  enableConsoleOutput: true,
  batchSize: 10,
  flushInterval: 30000
});

// Use the required Log function structure
logger.Log('backend', 'error', 'handler', 'received string, expected bool');
logger.Log('backend', 'fatal', 'db', 'Critical database connection failure.');
logger.Log('frontend', 'info', 'user-service', 'User successfully authenticated');
```

## Configuration Options

```javascript
const config = {
  testServerUrl: 'https://api.example.com',    // Required: Test server URL
  timeout: 5000,                               // HTTP request timeout (ms)
  retryAttempts: 3,                           // Number of retry attempts
  retryDelay: 1000,                           // Base retry delay (ms)
  enableConsoleOutput: true,                  // Enable console logging
  enableLocalStorage: false,                  // Enable browser local storage
  localStorageKey: 'app_logs',               // Local storage key
  batchSize: 10,                             // Logs per batch
  flushInterval: 30000                       // Auto-flush interval (ms)
};
```

## API Reference

### Core Logging Methods

#### `Log(stack, level, package, message, metadata?)`
The main logging function that matches the required structure.

```javascript
// Error logging example
logger.Log('backend', 'error', 'handler', 'received string, expected bool', {
  expectedType: 'boolean',
  receivedType: 'string',
  functionName: 'validateInput'
});

// Database error example
logger.Log('backend', 'fatal', 'db', 'Critical database connection failure.', {
  connectionString: 'mongodb://localhost:27017',
  error: 'ECONNREFUSED'
});
```

#### Convenience Methods

```javascript
// Debug logging
logger.debug('backend', 'validation', 'Input validation started', { userId: '12345' });

// Info logging  
logger.info('backend', 'auth', 'User login successful', { userId: '12345', ip: '192.168.1.1' });

// Warning logging
logger.warn('backend', 'rate-limiter', 'Rate limit approaching', { requests: 95, limit: 100 });

// Error logging
logger.error('backend', 'payment', 'Payment processing failed', { orderId: 'ORD123', amount: 99.99 });

// Fatal logging
logger.fatal('backend', 'system', 'Critical system failure', { component: 'database' });
```

### Specialized Logging Methods

#### `logError(stack, package, error, context?, metadata?)`
Log JavaScript Error objects with enhanced context.

```javascript
try {
  // Some operation that might fail
  await processPayment(order);
} catch (error) {
  logger.logError('backend', 'payment-service', error, 'Failed to process payment', {
    orderId: order.id,
    amount: order.total
  });
}
```

#### `logApiCall(stack, package, method, url, statusCode?, duration?, metadata?)`
Log HTTP API calls with timing and status information.

```javascript
// Log successful API call
logger.logApiCall('backend', 'user-service', 'GET', '/api/users/123', 200, 150, {
  userId: '123',
  source: 'admin-panel'
});

// Log failed API call
logger.logApiCall('backend', 'payment-api', 'POST', '/api/payments', 400, 89, {
  error: 'Invalid card number'
});
```

#### `logDatabaseOperation(stack, package, operation, collection?, duration?, metadata?)`
Log database operations with timing information.

```javascript
// Log database query
logger.logDatabaseOperation('backend', 'user-repository', 'SELECT', 'users', 45, {
  query: 'SELECT * FROM users WHERE id = ?',
  params: ['123']
});

// Log database insert
logger.logDatabaseOperation('backend', 'order-service', 'INSERT', 'orders', 23, {
  recordCount: 1,
  tableName: 'orders'
});
```

## Express Middleware Integration

```javascript
const express = require('express');
const { createLogger, expressLoggingMiddleware } = require('@url-shortener/logging-middleware');

const app = express();
const logger = createLogger({
  testServerUrl: 'https://your-test-server.com/api'
});

// Add logging middleware
app.use(expressLoggingMiddleware(logger));

// Your routes
app.get('/api/users', (req, res) => {
  // Request and response will be automatically logged
  logger.info('backend', 'user-controller', 'Fetching users list', {
    requestId: req.requestId
  });
  
  res.json({ users: [] });
});
```

## Integration with URL Shortener Backend

Here's how to integrate the logging middleware into your existing URL shortener:

```javascript
// In your backend/src/server.js
const { createLogger, expressLoggingMiddleware } = require('../logging-middleware/src/index');

// Initialize logger
const logger = createLogger({
  testServerUrl: process.env.TEST_SERVER_URL || 'http://localhost:8080/api',
  enableConsoleOutput: process.env.NODE_ENV !== 'production',
  batchSize: 20,
  flushInterval: 15000
});

// Add to Express app
app.use(expressLoggingMiddleware(logger));

// In your controllers
// backend/src/controllers/urlController.js
const { getLogger } = require('../../logging-middleware/src/index');

const createShortUrl = async (req, res) => {
  const logger = getLogger();
  
  try {
    logger.info('backend', 'url-controller', 'Creating short URL', {
      originalUrl: req.body.originalUrl,
      customShortcode: req.body.customShortcode,
      requestId: req.requestId
    });

    const result = await urlService.createShortUrl(req.body);
    
    logger.info('backend', 'url-controller', 'Short URL created successfully', {
      shortcode: result.shortcode,
      requestId: req.requestId
    });

    res.status(201).json(result);
  } catch (error) {
    logger.logError('backend', 'url-controller', error, 'Failed to create short URL', {
      requestBody: req.body,
      requestId: req.requestId
    });
    
    res.status(500).json({ error: 'Failed to create short URL' });
  }
};
```

## Log Entry Structure

Each log entry contains:

```javascript
{
  stack: 'backend',                    // Application stack
  level: 'error',                      // Log level
  package: 'user-service',            // Package/module name
  message: 'User authentication failed', // Descriptive message
  timestamp: '2025-01-28T10:30:00.000Z', // ISO 8601 timestamp
  requestId: 'req_1643366200000_1_abc123', // Unique request ID
  metadata: {                          // Additional context
    userId: '12345',
    ip: '192.168.1.1',
    nodeVersion: 'v18.0.0',           // Node.js environment info
    platform: 'darwin',
    memory: { rss: 123456, heapUsed: 67890 },
    uptime: 3600.5
  }
}
```

## Environment Variables

For optimal integration, set these environment variables:

```bash
# Test server configuration
TEST_SERVER_URL=https://your-test-server.com/api

# Logging configuration
LOG_LEVEL=info
ENABLE_CONSOLE_LOGGING=true
LOG_BATCH_SIZE=20
LOG_FLUSH_INTERVAL=15000
```

## Production Best Practices

1. **Set appropriate log levels** for production vs development
2. **Configure batch sizes** based on your application's load
3. **Use structured metadata** for better log analysis
4. **Include request IDs** for request tracing
5. **Handle sensitive data** carefully in log messages
6. **Monitor log queue sizes** to prevent memory issues

## Graceful Shutdown

```javascript
// Ensure logs are flushed before application shutdown
process.on('SIGINT', async () => {
  await logger.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await logger.shutdown();
  process.exit(0);
});
```

## Examples

### Backend Application Logging

```javascript
// Database connection logging
logger.Log('backend', 'info', 'database', 'Attempting MongoDB connection', {
  connectionString: 'mongodb://localhost:27017/urlshortener'
});

// Validation error
logger.Log('backend', 'error', 'validator', 'Invalid URL format provided', {
  providedUrl: 'not-a-valid-url',
  validationRule: 'URL_FORMAT'
});

// Performance monitoring
logger.Log('backend', 'warn', 'performance', 'Slow database query detected', {
  query: 'findUrlByShortcode',
  duration: 1500,
  threshold: 1000
});
```

### Frontend Application Logging

```javascript
// User interaction logging
logger.Log('frontend', 'info', 'ui-component', 'User clicked shorten URL button', {
  url: 'https://example.com',
  customShortcode: 'my-link'
});

// API error handling
logger.Log('frontend', 'error', 'api-client', 'Failed to fetch URL analytics', {
  shortcode: 'abc123',
  statusCode: 404,
  errorMessage: 'URL not found'
});
```

## License

MIT License - see LICENSE file for details.
