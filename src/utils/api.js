import axios from 'axios';

// Create axios instance with baseURL for production support
const api = axios.create({
  // Prefer env override; fallback to dev proxy (empty) or 5001 to match backend default
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
  timeout: 300000, // 5 minutes timeout (increased from 30 seconds for large PDF processing)
  headers: {
    // Don't set Content-Type globally: FormData uploads must set multipart boundary automatically.
    Accept: 'application/json',
  },
});

// Request interceptor for logging (optional)
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // Ensure we don't force JSON content-type for FormData uploads
    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData;
    if (isFormData) {
      if (config.headers) {
        // axios lowercases headers internally in some adapters; handle both cases
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    } else {
      // For JSON requests, set content-type if not already set
      config.headers = config.headers || {};
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      // Network error or timeout
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. The PDF processing is taking longer than expected. Please try with a smaller PDF or wait a moment and try again.';
      } else if (error.message === 'Network Error') {
        error.message = 'Cannot connect to server. Please ensure the backend is running on port 5001.';
      }
    }
    return Promise.reject(error);
  }
);

export default api;