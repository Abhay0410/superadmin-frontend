import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_REACT_APP_API_BASE_URL || 'http://localhost:5000';
const TOKEN_KEY = import.meta.env.VITE_REACT_APP_AUTH_TOKEN_KEY || 'superAdminToken';

// Create an axios instance specifically for the superadmin namespace
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/superadmin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;