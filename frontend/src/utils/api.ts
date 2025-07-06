import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
axios.defaults.withCredentials = true;

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      // Could redirect to login page or show login modal
      console.log('Unauthorized access detected');
    }
    return Promise.reject(error);
  }
);

export default axios;