import axios from 'axios';
import store from '../app/store';
import { logout, setToken } from '../features/auth/authSlice';
import { handleMockRequest } from './mockDb';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://pos-backend-ocsh.onrender.com/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ─── Render free-tier cold-start: ping the backend to wake it up ──────────────
// Render free instances sleep after 15 min of inactivity. We ping /health on
// app load so by the time the user fills the form & hits submit the server is
// already awake. The ping itself is fire-and-forget with a very long timeout.
export const pingBackend = async () => {
  try {
    await axios.get(`${BASE_URL.replace('/api/v1', '')}/health`, { timeout: 60000 });
  } catch {
    // Silently ignore — we tried our best
  }
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // 60 s — enough to survive a Render cold start (usually 30-50 s)
  timeout: 60000,
  withCredentials: true,
  ...(USE_MOCK && {
    adapter: async (config) => {
      try {
        const response = await handleMockRequest(config);
        return response;
      } catch (err) {
        throw err;
      }
    }
  })
});

// ─── Request interceptor ─────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Silent JWT refresh logic ─────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ─── Response interceptor ────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If we get a 401 and haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = data?.data?.accessToken || data?.accessToken || data?.token;
        store.dispatch(setToken(newToken));
        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalise error shape so callers always get { message, ... }
    return Promise.reject(error?.response?.data || error);
  }
);

export default api;
