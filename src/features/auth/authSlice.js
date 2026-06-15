import { createSlice } from '@reduxjs/toolkit';

const userFromStorage = (() => {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
})();
const tokenFromStorage = localStorage.getItem('token') || null;
const tenantIdFromStorage = localStorage.getItem('tenantId') || null;

const initialState = {
  user: userFromStorage,
  token: tokenFromStorage,
  tenantId: tenantIdFromStorage || userFromStorage?.tenantId || null,
  isAuthenticated: !!tokenFromStorage,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Normalise backend response — backend may return `accessToken` OR `token`
    setCredentials: (state, action) => {
      const { user, token, accessToken } = action.payload;
      const resolvedToken = accessToken || token;
      const resolvedTenantId = action.payload.tenantId || user?.tenantId;
      state.user = user;
      state.token = resolvedToken;
      state.tenantId = resolvedTenantId || state.tenantId;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem('token', resolvedToken);
      localStorage.setItem('user', JSON.stringify(user));
      if (resolvedTenantId) {
        localStorage.setItem('tenantId', resolvedTenantId);
      }
    },
    // Used by the silent JWT refresh interceptor — only update the token
    setToken: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Keep tenantId in state & localStorage to pre-fill login page
    },
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
      if (state.user?.tenantId) {
        state.tenantId = state.user.tenantId;
        localStorage.setItem('tenantId', state.user.tenantId);
      }
    },
    setTenantId: (state, action) => {
      state.tenantId = action.payload;
      localStorage.setItem('tenantId', action.payload);
    }
  },
});

export const { setCredentials, setToken, logout, setLoading, setError, updateUser, setTenantId } = authSlice.actions;
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => {
  const role = state.auth.user?.role;
  return typeof role === 'object' && role !== null ? role.name : role;
};
export const selectToken = (state) => state.auth.token;
export const selectTenantId = (state) => state.auth.tenantId;
export default authSlice.reducer;
