import axios from 'axios';

// In production (Vercel), VITE_API_URL points to the Render backend (e.g. https://your-backend.onrender.com/api/v1)
// In local dev, falls back to '/api/v1' which the Vite proxy forwards to localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle Authentication Expiry (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      // Only redirect if not already on login/reset pages to prevent infinite loops
      if (!window.location.pathname.startsWith('/login') && 
          !window.location.pathname.startsWith('/reset-password') &&
          !window.location.pathname.startsWith('/forgot-password')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
