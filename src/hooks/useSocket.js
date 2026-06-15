/**
 * useSocket.js
 *
 * Connects to the Socket.IO server using the JWT access token.
 * Dispatches real-time notifications into the Redux store via addNotification.
 *
 * Usage: mount this hook once inside DashboardLayout (authenticated zone).
 */
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { selectToken } from '../features/auth/authSlice';
import { addNotification, seedNotifications } from '../features/notifications/notificationSlice';
import { notificationApi } from '../api/services';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://pos-backend-ocsh.onrender.com';

export const useSocket = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // ── 1. Seed existing notifications from the REST API ─────────────────────
    notificationApi
      .getAll({ limit: 20 })
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data?.notifications ?? [];
        if (list.length) dispatch(seedNotifications(list));
      })
      .catch(() => {
        // silently ignore — notifications are non-critical
      });

    // ── 2. Connect to the WebSocket server ───────────────────────────────────
    const socket = io(SOCKET_URL, {
      auth: { token },                  // backend reads socket.handshake.auth.token
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    // ── 3. Listen for real-time events ───────────────────────────────────────
    socket.on('connect', () => {
      console.info('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.info('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Generic notification event — backend emits: { title, message, type, ... }
    socket.on('notification', (payload) => {
      dispatch(addNotification(payload));
    });

    // Domain-specific events you can extend later
    socket.on('sale:new',        (payload) => dispatch(addNotification({ type: 'sale',    ...payload })));
    socket.on('repair:update',   (payload) => dispatch(addNotification({ type: 'repair',  ...payload })));
    socket.on('inventory:alert', (payload) => dispatch(addNotification({ type: 'warning', ...payload })));
    socket.on('task:assigned',   (payload) => dispatch(addNotification({ type: 'task',    ...payload })));

    // ── 4. Clean up on unmount / token change ────────────────────────────────
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, dispatch]);

  return socketRef;
};
