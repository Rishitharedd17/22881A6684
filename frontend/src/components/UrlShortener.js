import React, { useState } from 'react';
import urlService from '../services/apiService';
import './UrlShortener.css';

const UrlShortener = () => {
  const [formData, setFormData] = useState({
    url: '',
    validity: 30,
    shortcode: ''
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Validate URL format
      if (!formData.url) {
        throw new Error('URL is required');
      }

      // Basic URL validation
      if (!formData.url.match(/^https?:\/\/.+/)) {
        throw new Error('Please enter a valid URL starting with http:// or https://');
      }

      // Prepare data for API
      const apiData = {
        url: formData.url.trim(),
        validity: parseInt(formData.validity) || 30
      };

      // Add custom shortcode if provided
      if (formData.shortcode.trim()) {
        apiData.shortcode = formData.shortcode.trim();
      }

      const response = await urlService.createShortUrl(apiData);
      setResult(response);

      // Reset form
      setFormData({
        url: '',
        validity: 30,
        shortcode: ''
      });
    } catch (err) {
      setError(err.message || 'An error occurred while creating the short URL');
    } finally {
      setLoading(false);
    }
  };

  const handleGetAnalytics = async (shortcode) => {
    setAnalyticsLoading(true);
    setAnalytics(null);

    try {
      const analyticsData = await urlService.getUrlAnalytics(shortcode);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Copied to clipboard!');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day(s) remaining`;
    if (diffHours > 0) return `${diffHours} hour(s) remaining`;
    return `${diffMins} minute(s) remaining`;
  };

  return (
    <div className="url-shortener">
      <div className="container">
        <header className="header">
          <h1>🔗 URL Shortener</h1>
          <p>Create short, manageable links with analytics</p>
        </header>

        <div className="main-content">
          <form onSubmit={handleSubmit} className="shortener-form">
            <div className="form-group">
              <label htmlFor="url">Enter URL to shorten *</label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://example.com/your-very-long-url"
                required
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="validity">Validity (minutes)</label>
                <input
                  type="number"
                  id="validity"
                  name="validity"
                  value={formData.validity}
                  onChange={handleInputChange}
                  min="1"
                  max="10080"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="shortcode">Custom Shortcode (optional)</label>
                <input
                  type="text"
                  id="shortcode"
                  name="shortcode"
                  value={formData.shortcode}
                  onChange={handleInputChange}
                  placeholder="custom123"
                  pattern="[a-zA-Z0-9]{3,20}"
                  title="3-20 alphanumeric characters only"
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Creating...' : 'Shorten URL'}
            </button>
          </form>

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}

          {result && (
            <div className="result-section">
              <h2>✅ Short URL Created Successfully!</h2>
              
              <div className="result-card">
                <div className="result-item">
                  <label>Original URL:</label>
                  <div className="url-display">
                    <a href={result.originalUrl} target="_blank" rel="noopener noreferrer">
                      {result.originalUrl}
                    </a>
                  </div>
                </div>

                <div className="result-item">
                  <label>Short URL:</label>
                  <div className="url-display short-url">
                    <a href={result.shortUrl} target="_blank" rel="noopener noreferrer">
                      {result.shortUrl}
                    </a>
                    <button 
                      onClick={() => copyToClipboard(result.shortUrl)}
                      className="copy-btn"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <div className="result-info">
                  <div className="info-item">
                    <span className="label">Shortcode:</span>
                    <span className="value">{result.shortcode}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Created:</span>
                    <span className="value">{formatDate(result.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Expires:</span>
                    <span className="value">{formatDate(result.expiresAt)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Time Remaining:</span>
                    <span className="value time-remaining">{formatTimeRemaining(result.expiresAt)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => handleGetAnalytics(result.shortcode)}
                  disabled={analyticsLoading}
                  className="analytics-btn"
                >
                  {analyticsLoading ? 'Loading...' : '📊 View Analytics'}
                </button>
              </div>
            </div>
          )}

          {analytics && (
            <div className="analytics-section">
              <h2>📊 Analytics for {analytics.shortcode}</h2>
              
              <div className="analytics-card">
                <div className="analytics-header">
                  <div className="analytics-item">
                    <span className="label">Total Clicks:</span>
                    <span className="value highlight">{analytics.clickCount}</span>
                  </div>
                  <div className="analytics-item">
                    <span className="label">Status:</span>
                    <span className={`value status ${analytics.isExpired ? 'expired' : 'active'}`}>
                      {analytics.isExpired ? '🔴 Expired' : '🟢 Active'}
                    </span>
                  </div>
                </div>

                <div className="analytics-details">
                  <div className="detail-item">
                    <span className="label">Original URL:</span>
                    <span className="value">{analytics.originalUrl}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Created:</span>
                    <span className="value">{formatDate(analytics.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Expires:</span>
                    <span className="value">{formatDate(analytics.expiresAt)}</span>
                  </div>
                </div>

                {analytics.clicks && analytics.clicks.length > 0 && (
                  <div className="clicks-section">
                    <h3>Recent Clicks ({analytics.clicks.length})</h3>
                    <div className="clicks-list">
                      {analytics.clicks.slice(-10).reverse().map((click, index) => (
                        <div key={index} className="click-item">
                          <div className="click-time">{formatDate(click.timestamp)}</div>
                          <div className="click-details">
                            <span className="click-ip">{click.ip || 'Unknown IP'}</span>
                            {click.userAgent && (
                              <span className="click-agent" title={click.userAgent}>
                                {click.userAgent.split(' ')[0]}
                              </span>
                            )}
                            {click.referer && (
                              <span className="click-referer" title={click.referer}>
                                from {new URL(click.referer).hostname}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="footer">
          <p>🔒 Secure • ⚡ Fast • 📈 Analytics • 🎯 Production Ready</p>
        </footer>
      </div>
    </div>
  );
};

export default UrlShortener;
