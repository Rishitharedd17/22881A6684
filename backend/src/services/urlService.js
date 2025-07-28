const crypto = require('crypto');
const inMemoryStore = require('../models/InMemoryStore');

// Get logger instance
const getLogger = () => global.appLogger;

class UrlService {
  /**
   * Generate a random shortcode
   * @param {number} length - Length of the shortcode
   * @returns {string} - Random alphanumeric string
   */
  generateShortcode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      const randomByte = crypto.randomBytes(1)[0];
      result += chars[randomByte % chars.length];
    }
    
    return result;
  }

  /**
   * Generate a unique shortcode that doesn't exist in the database
   * @param {number} maxAttempts - Maximum attempts to generate unique code
   * @returns {Promise<string>} - Unique shortcode
   */
  async generateUniqueShortcode(maxAttempts = 10) {
    const logger = getLogger();
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const shortcode = this.generateShortcode();
      const existing = inMemoryStore.findByShortcode(shortcode);
      
      if (!existing) {
        logger.Log('backend', 'debug', 'url-service', 'Unique shortcode generated successfully', {
          shortcode,
          attemptsRequired: attempt + 1
        });
        return shortcode;
      }
      
      logger.Log('backend', 'warn', 'url-service', 'Shortcode collision detected', { 
        shortcode, 
        attempt,
        maxAttempts
      });
    }

    logger.Log('backend', 'error', 'url-service', 'Failed to generate unique shortcode after maximum attempts', {
      maxAttempts,
      lastAttemptNumber: maxAttempts
    });
    
    throw new Error('Unable to generate unique shortcode after maximum attempts');
  }

  /**
   * Validate and normalize URL
   * @param {string} url - URL to validate
   * @returns {string} - Normalized URL
   */
  validateAndNormalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are allowed');
      }
      
      return urlObj.toString();
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Calculate expiry date
   * @param {number} validityMinutes - Validity in minutes (default: 30)
   * @returns {Date} - Expiry date
   */
  calculateExpiryDate(validityMinutes = 30) {
    const now = new Date();
    return new Date(now.getTime() + (validityMinutes * 60 * 1000));
  }

  /**
   * Create a short URL
   * @param {Object} data - URL creation data
   * @param {string} data.url - Original URL
   * @param {number} [data.validity] - Validity in minutes
   * @param {string} [data.shortcode] - Custom shortcode
   * @returns {Promise<Object>} - Created URL object
   */
  async createShortUrl(data) {
    const { url, validity = 30, shortcode: customShortcode } = data;

    // Validate and normalize URL
    const normalizedUrl = this.validateAndNormalizeUrl(url);

    // Generate or validate shortcode
    let shortcode;
    if (customShortcode) {
      // Validate custom shortcode format
      if (!/^[a-zA-Z0-9]{3,20}$/.test(customShortcode)) {
        throw new Error('Custom shortcode must be alphanumeric and between 3-20 characters');
      }

      // Check if custom shortcode already exists
      const existing = inMemoryStore.findByShortcode(customShortcode);
      if (existing) {
        throw new Error('Custom shortcode already exists');
      }
      
      shortcode = customShortcode;
    } else {
      shortcode = await this.generateUniqueShortcode();
    }

    // Calculate expiry date
    const expiresAt = this.calculateExpiryDate(validity);

    // Create URL in memory store
    const urlDoc = inMemoryStore.create({
      originalUrl: normalizedUrl,
      shortcode,
      expiresAt
    });

    const logger = getLogger();
    logger.Log('backend', 'info', 'url-service', 'Short URL created successfully', {
      shortcode,
      originalUrl: normalizedUrl,
      expiresAt: expiresAt.toISOString(),
      customShortcode: !!customShortcode
    });

    return {
      shortcode,
      originalUrl: normalizedUrl,
      shortUrl: `${process.env.BASE_URL}/${shortcode}`,
      expiresAt: expiresAt.toISOString(),
      createdAt: urlDoc.createdAt.toISOString()
    };
  }

  /**
   * Get URL by shortcode
   * @param {string} shortcode - Shortcode to lookup
   * @returns {Promise<Object|null>} - URL object or null if not found
   */
  async getUrlByShortcode(shortcode) {
    const logger = getLogger();
    const urlDoc = inMemoryStore.findByShortcode(shortcode);
    
    if (!urlDoc) {
      return null;
    }

    // Check if expired (already handled by store)
    return urlDoc;
  }

  /**
   * Record a click on a short URL
   * @param {Object} urlDoc - URL document
   * @param {Object} clickData - Click metadata
   * @returns {Promise<Object>} - Updated URL document
   */
  async recordClick(urlDoc, clickData = {}) {
    await urlDoc.addClick(clickData);
    
    logger.info('URL click recorded', {
      shortcode: urlDoc.shortcode,
      clickCount: urlDoc.clickCount,
      userAgent: clickData.userAgent,
      ip: clickData.ip
    });

    return urlDoc;
  }

  /**
   * Get analytics for a short URL
   * @param {string} shortcode - Shortcode to get analytics for
   * @returns {Promise<Object|null>} - Analytics data or null if not found
   */
  async getUrlAnalytics(shortcode) {
    const analytics = inMemoryStore.getAnalytics(shortcode);
    
    if (!analytics) {
      return null;
    }

    return analytics;
  }

  /**
   * Record a click for a short URL
   * @param {string} shortcode - Shortcode to record click for
   * @param {Object} clickData - Click data (ip, userAgent, referer)
   * @returns {Promise<boolean>} - Success status
   */
  async recordClick(shortcode, clickData) {
    const logger = getLogger();
    const success = inMemoryStore.addClick(shortcode, clickData);
    
    if (success) {
      logger.Log('backend', 'debug', 'url-service', 'Click recorded successfully', {
        shortcode,
        ip: clickData.ip,
        userAgent: clickData.userAgent
      });
    }
    
    return success;
  }

  /**
   * Clean up expired URLs
   * @returns {Promise<number>} - Number of deleted URLs
   */
  async cleanupExpiredUrls() {
    return inMemoryStore.cleanupExpired();
  }
}

module.exports = new UrlService();
