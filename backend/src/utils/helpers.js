/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
const isValidUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Generate random string
 * @param {number} length - Length of random string
 * @param {string} chars - Characters to use
 * @returns {string} - Random string
 */
const generateRandomString = (length = 8, chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') => {
  const crypto = require('crypto');
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomByte = crypto.randomBytes(1)[0];
    result += chars[randomByte % chars.length];
  }
  
  return result;
};

/**
 * Format date to ISO string
 * @param {Date} date - Date to format
 * @returns {string} - ISO formatted date
 */
const formatDate = (date) => {
  return date ? date.toISOString() : new Date().toISOString();
};

/**
 * Calculate time difference in minutes
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} - Difference in minutes
 */
const getTimeDifferenceInMinutes = (date1, date2) => {
  const diffInMs = Math.abs(date2 - date1);
  return Math.floor(diffInMs / (1000 * 60));
};

/**
 * Check if date is in the future
 * @param {Date} date - Date to check
 * @returns {boolean} - True if date is in future
 */
const isFutureDate = (date) => {
  return date > new Date();
};

/**
 * Parse user agent for basic information
 * @param {string} userAgent - User agent string
 * @returns {Object} - Parsed user agent info
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
  
  const ua = userAgent.toLowerCase();
  
  let browser = 'Unknown';
  let os = 'Unknown';
  
  // Browser detection
  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';
  
  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios')) os = 'iOS';
  
  return { browser, os };
};

/**
 * Validate shortcode format
 * @param {string} shortcode - Shortcode to validate
 * @returns {boolean} - True if valid shortcode
 */
const isValidShortcode = (shortcode) => {
  return typeof shortcode === 'string' && /^[a-zA-Z0-9]{3,20}$/.test(shortcode);
};

/**
 * Get client IP from request
 * @param {Object} req - Express request object
 * @returns {string} - Client IP address
 */
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'Unknown';
};

module.exports = {
  isValidUrl,
  sanitizeInput,
  generateRandomString,
  formatDate,
  getTimeDifferenceInMinutes,
  isFutureDate,
  parseUserAgent,
  isValidShortcode,
  getClientIP
};
