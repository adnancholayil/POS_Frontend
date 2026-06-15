import axios from 'axios';
import store from '../app/store';
import { logout, setToken } from '../features/auth/authSlice';
import { handleMockRequest } from './mockDb';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://pos-backend-ocsh.onrender.com/api/v1';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
  withCredentials: true, // send refresh-token cookie if the backend uses httpOnly cookies
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
// Attach the current access token to every request.
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Silent JWT refresh logic ─────────────────────────────────────────────────
// A queue of callbacks waiting for a new token so we don't fire multiple
// /auth/refresh calls simultaneously.
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
        // Queue this request until the refresh completes
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
        // Ask the backend for a new access token using the httpOnly refresh cookie
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
