// In-memory storage for URL shortener
class InMemoryStore {
  constructor() {
    this.urls = new Map();
    this.analytics = new Map();
  }

  // Create a new URL entry
  create(data) {
    const { shortcode, originalUrl, expiresAt } = data;
    
    if (this.urls.has(shortcode)) {
      throw new Error('Shortcode already exists');
    }

    const urlEntry = {
      id: shortcode,
      shortcode,
      originalUrl,
      expiresAt: expiresAt || new Date(Date.now() + 30 * 60 * 1000), // 30 minutes default
      createdAt: new Date(),
      clicks: []
    };

    this.urls.set(shortcode, urlEntry);
    this.analytics.set(shortcode, { totalClicks: 0, uniqueClicks: 0 });
    
    return urlEntry;
  }

  // Find URL by shortcode
  findByShortcode(shortcode) {
    const url = this.urls.get(shortcode);
    if (!url) return null;
    
    // Check if expired
    if (url.expiresAt && new Date() > url.expiresAt) {
      this.urls.delete(shortcode);
      this.analytics.delete(shortcode);
      return null;
    }
    
    return url;
  }

  // Add click to URL
  addClick(shortcode, clickData) {
    const url = this.urls.get(shortcode);
    if (!url) return false;

    // Check if expired
    if (url.expiresAt && new Date() > url.expiresAt) {
      this.urls.delete(shortcode);
      this.analytics.delete(shortcode);
      return false;
    }

    const click = {
      timestamp: new Date(),
      userAgent: clickData.userAgent || '',
      ip: clickData.ip || '',
      referer: clickData.referer || ''
    };

    url.clicks.push(click);
    
    // Update analytics
    const analytics = this.analytics.get(shortcode);
    analytics.totalClicks++;
    
    // Count unique clicks by IP (simple approach)
    const uniqueIps = new Set(url.clicks.map(c => c.ip));
    analytics.uniqueClicks = uniqueIps.size;

    return true;
  }

  // Get analytics for a shortcode
  getAnalytics(shortcode) {
    const url = this.urls.get(shortcode);
    if (!url) return null;

    // Check if expired
    if (url.expiresAt && new Date() > url.expiresAt) {
      this.urls.delete(shortcode);
      this.analytics.delete(shortcode);
      return null;
    }

    const analytics = this.analytics.get(shortcode);
    return {
      shortcode,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
      totalClicks: analytics.totalClicks,
      uniqueClicks: analytics.uniqueClicks,
      clicks: url.clicks
    };
  }

  // Clean up expired URLs (can be called periodically)
  cleanupExpired() {
    const now = new Date();
    const expired = [];
    
    for (const [shortcode, url] of this.urls.entries()) {
      if (url.expiresAt && now > url.expiresAt) {
        expired.push(shortcode);
      }
    }
    
    expired.forEach(shortcode => {
      this.urls.delete(shortcode);
      this.analytics.delete(shortcode);
    });
    
    return expired.length;
  }

  // Get all URLs (for debugging/testing)
  getAll() {
    return Array.from(this.urls.values());
  }

  // Get store stats
  getStats() {
    return {
      totalUrls: this.urls.size,
      totalClicks: Array.from(this.analytics.values()).reduce((sum, a) => sum + a.totalClicks, 0)
    };
  }
}

// Export singleton instance
module.exports = new InMemoryStore();
