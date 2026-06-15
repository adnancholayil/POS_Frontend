import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.items.unshift({ id: Date.now(), read: false, createdAt: new Date().toISOString(), ...action.payload });
      state.unreadCount += 1;
    },
    markAsRead: (state, action) => {
      const n = state.items.find((i) => i.id === action.payload);
      if (n && !n.read) { n.read = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
    },
    markAllAsRead: (state) => {
      state.items.forEach((i) => (i.read = true));
      state.unreadCount = 0;
    },
    removeNotification: (state, action) => {
      const idx = state.items.findIndex((i) => i.id === action.payload);
      if (idx !== -1) {
        if (!state.items[idx].read) state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.items.splice(idx, 1);
      }
    },
    clearAll: (state) => { state.items = []; state.unreadCount = 0; },
    seedNotifications: (state, action) => {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read).length;
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead, removeNotification, clearAll, seedNotifications } = notificationSlice.actions;
export const selectNotifications = (state) => state.notifications.items;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export default notificationSlice.reducer;
