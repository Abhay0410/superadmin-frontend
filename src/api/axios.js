import axios from 'axios';

function getBaseURL() {
  let envUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    if (envUrl.endsWith('/')) envUrl = envUrl.slice(0, -1);
    return envUrl;
  }

  // RUNTIME CHECK: If on Vercel, use relative path so vercel.json proxy catches it!
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return ""; 
  }
  
  return 'http://localhost:5000';
}

const API_BASE_URL = getBaseURL();
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