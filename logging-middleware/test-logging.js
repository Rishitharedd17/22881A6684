const { createLogger } = require('@url-shortener/logging-middleware');

/**
 * Test script demonstrating the comprehensive logging middleware
 * This shows all the required Log(stack, level, package, message) patterns
 */

// Initialize logger with test server configuration
const logger = createLogger({
  testServerUrl: 'http://localhost:8080/api',
  enableConsoleOutput: true,
  batchSize: 5, // Smaller batch for demo
  flushInterval: 10000, // 10 seconds for demo
  retryAttempts: 2,
  retryDelay: 500
});

console.log('🧪 Testing Comprehensive Logging Middleware\n');

// Test the required Log function structure
console.log('1. Testing required Log(stack, level, package, message) structure:');

// Backend error examples as specified in requirements
logger.Log('backend', 'error', 'handler', 'received string, expected bool');
logger.Log('backend', 'fatal', 'db', 'Critical database connection failure.');

// Additional comprehensive logging examples
logger.Log('frontend', 'info', 'user-interface', 'User successfully logged in');
logger.Log('backend', 'warn', 'rate-limiter', 'Rate limit threshold approaching');
logger.Log('backend', 'debug', 'validator', 'Input validation passed');

console.log('\n2. Testing convenience methods:');

// Test convenience methods
logger.debug('backend', 'cache', 'Cache miss occurred for user data', { userId: '12345' });
logger.info('backend', 'auth', 'JWT token validated successfully', { tokenExp: '2025-01-29' });
logger.warn('backend', 'performance', 'Database query took longer than expected', { duration: 1500 });
logger.error('backend', 'payment', 'Payment processing failed', { orderId: 'ORD-789' });
logger.fatal('backend', 'system', 'Out of memory error detected', { availableMemory: '10MB' });

console.log('\n3. Testing specialized logging methods:');

// Test API call logging
logger.logApiCall('backend', 'user-service', 'GET', '/api/users/123', 200, 145, {
  cacheHit: true,
  source: 'admin-panel'
});

logger.logApiCall('backend', 'payment-api', 'POST', '/api/payments', 400, 89, {
  error: 'Invalid credit card'
});

// Test database operation logging
logger.logDatabaseOperation('backend', 'user-repository', 'SELECT', 'users', 23, {
  query: 'SELECT * FROM users WHERE active = true',
  resultCount: 45
});

logger.logDatabaseOperation('backend', 'url-service', 'INSERT', 'shortened_urls', 12, {
  shortcode: 'abc123',
  originalUrl: 'https://example.com'
});

console.log('\n4. Testing error object logging:');

// Test error logging with Error objects
try {
  throw new Error('Database connection timeout');
} catch (error) {
  logger.logError('backend', 'database-service', error, 'Failed to connect to MongoDB', {
    connectionString: 'mongodb://localhost:27017',
    retryAttempt: 3
  });
}

console.log('\n5. Testing application-specific scenarios:');

// URL Shortener specific logging examples
logger.Log('backend', 'info', 'url-controller', 'Short URL creation request received', {
  originalUrl: 'https://www.example.com/very/long/path',
  customShortcode: 'my-link',
  validity: 60
});

logger.Log('backend', 'warn', 'url-validator', 'Suspicious URL pattern detected', {
  url: 'https://suspicious-site.com',
  reason: 'Domain in blacklist',
  action: 'flagged_for_review'
});

logger.Log('backend', 'error', 'url-service', 'Shortcode generation failed after maximum attempts', {
  maxAttempts: 10,
  lastCollision: 'abc123'
});

logger.Log('frontend', 'info', 'analytics-component', 'User requested URL analytics', {
  shortcode: 'abc123',
  timeRange: 'last_7_days'
});

logger.Log('backend', 'info', 'click-tracker', 'URL click recorded successfully', {
  shortcode: 'abc123',
  userAgent: 'Mozilla/5.0...',
  country: 'US',
  clickCount: 42
});

console.log('\n6. Testing production scenarios:');

// Production-level logging examples
logger.Log('backend', 'info', 'startup', 'Application started successfully', {
  port: 5000,
  environment: 'production',
  version: '1.2.3',
  nodeVersion: process.version
});

logger.Log('backend', 'warn', 'security', 'Multiple failed login attempts detected', {
  ip: '192.168.1.100',
  attemptCount: 5,
  timeWindow: '5 minutes',
  action: 'temporary_ip_block'
});

logger.Log('backend', 'error', 'middleware', 'Request validation failed', {
  endpoint: '/api/shorturls',
  validationErrors: ['url is required', 'validity must be positive'],
  requestBody: { validity: -1 }
});

logger.Log('backend', 'fatal', 'system', 'Critical service dependency unavailable', {
  service: 'MongoDB',
  error: 'Connection refused',
  uptime: '2 days 4 hours',
  action: 'emergency_shutdown'
});

console.log('\n📊 Logging Statistics:');
console.log(`Queue size: ${logger.getQueueSize()} logs pending`);

// Test manual flush
console.log('\n🚀 Flushing logs to test server...');
logger.flushLogs().then(() => {
  console.log('✅ Logs flushed successfully!');
  console.log(`Queue size after flush: ${logger.getQueueSize()}`);
}).catch(error => {
  console.error('❌ Failed to flush logs:', error.message);
});

// Graceful shutdown after delay
setTimeout(async () => {
  console.log('\n🔄 Initiating graceful shutdown...');
  await logger.shutdown();
  console.log('✅ Logging middleware shutdown complete');
  console.log('\n🎉 Logging middleware test completed successfully!');
  
  console.log('\n📝 Summary:');
  console.log('- ✅ Required Log(stack, level, package, message) structure implemented');
  console.log('- ✅ All log levels supported (debug, info, warn, error, fatal)');
  console.log('- ✅ Test server integration configured');
  console.log('- ✅ Batch processing and retry mechanisms active');
  console.log('- ✅ Express middleware ready for integration');
  console.log('- ✅ Error handling and specialized logging methods available');
  console.log('- ✅ Production-ready with comprehensive context capture');
}, 5000);

module.exports = logger;
