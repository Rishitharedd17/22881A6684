import axios from 'axios';

const API_BASE_URL = 'http://localhost:5002';

// JWT Token for authentication
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJkZXZpcmVkZHlyaXNoaXRoYXJlZGR5QGdtYWlsLmNvbSIsImV4cCI6MTc1MzY4MjQ3NywiaWF0IjoxNzUzNjgxNTc3LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiMzU0MDY0MmEtZmYxMy00MzYxLTlmYjMtNTk0OGJkM2JlOTRiIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiZCByaXNoaXRoYSByZWRkeSIsInN1YiI6ImMzZGI4YjJjLTZlNzItNDg4MS1iYTQ2LWE5OWMyYjA1ODE3NCJ9LCJlbWFpbCI6ImRldmlyZWRkeXJpc2hpdGhhcmVkZHlAZ21haWwuY29tIiwibmFtZSI6ImQgcmlzaGl0aGEgcmVkZHkiLCJyb2xsTm8iOiIyMjg4MWE2Njg0IiwiYWNjZXNzQ29kZSI6IndQRWZHWiIsImNsaWVudElEIjoiYzNkYjhiMmMtNmU3Mi00ODgxLWJhNDYtYTk5YzJiMDU4MTc0IiwiY2xpZW50U2VjcmV0IjoidHRKc1FSQUdrRmNuWkZDZSJ9.xBQfGfxiiH5zXxplg4lpbManU1LmYHidpj3-K74aExY';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`,
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method.toUpperCase(),
      url: config.url,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

const urlService = {
  /**
   * Create a short URL
   * @param {Object} data - URL creation data
   * @param {string} data.url - Original URL
   * @param {number} [data.validity] - Validity in minutes
   * @param {string} [data.shortcode] - Custom shortcode
   * @returns {Promise} - API response
   */
  async createShortUrl(data) {
    try {
      const response = await apiClient.post('/shorturls', data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  },

  /**
   * Get URL analytics
   * @param {string} shortcode - Shortcode to get analytics for
   * @returns {Promise} - API response
   */
  async getUrlAnalytics(shortcode) {
    try {
      const response = await apiClient.get(`/shorturls/${shortcode}/analytics`);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  },

  /**
   * Check service health
   * @returns {Promise} - API response
   */
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  },

  /**
   * Handle API errors and return user-friendly error objects
   * @param {Error} error - Axios error object
   * @returns {Object} - Formatted error object
   */
  handleApiError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        status: error.response.status,
        message: error.response.data?.message || 'An error occurred',
        error: error.response.data?.error || 'API Error',
        details: error.response.data?.details || null
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        status: 0,
        message: 'Unable to connect to the server. Please check your internet connection.',
        error: 'Network Error'
      };
    } else {
      // Something else happened
      return {
        status: 0,
        message: error.message || 'An unexpected error occurred',
        error: 'Unknown Error'
      };
    }
  },

  /**
   * Get the full short URL
   * @param {string} shortcode - Shortcode
   * @returns {string} - Full short URL
   */
  getShortUrl(shortcode) {
    return `${API_BASE_URL}/${shortcode}`;
  }
};

export default urlService;
