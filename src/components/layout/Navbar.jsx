import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMenu, FiSun, FiMoon, FiBell, FiSearch, FiChevronDown,
  FiUser, FiSettings, FiLogOut, FiX, FiCheck,
} from 'react-icons/fi';
import { logout } from '../../features/auth/authSlice';
import { toggleSidebar, toggleSidebarCollapse } from '../../features/ui/uiSlice';
import { markAllAsRead, markAsRead, selectNotifications, selectUnreadCount } from '../../features/notifications/notificationSlice';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { notificationApi } from '../../api/services';
import { useTheme } from '../../hooks/useTheme';
import { Avatar, CountBadge } from '../ui/Badge';
import { cn, timeAgo } from '../../utils/helpers';

const DropdownMenu = ({ isOpen, onClose, children, className = '' }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'absolute right-0 top-full mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden',
            className
          )}
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const NotificationItem = ({ item, onRead }) => (
  <div
    className={cn(
      'flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0',
      !item.read && 'bg-blue-50/50 dark:bg-blue-900/10'
    )}
    onClick={() => onRead(item.id)}
  >
    <div className={cn('w-2 h-2 rounded-full mt-2 shrink-0', item.read ? 'bg-transparent' : 'bg-blue-500')} />
    <div className="flex-1 min-w-0">
      <p className={cn('text-xs leading-snug', item.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200 font-semibold')}>
        {item.message}
      </p>
      <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(item.createdAt)}</p>
    </div>
  </div>
);

export const Navbar = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      dispatch(markAsRead(id));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllRead();
      dispatch(markAllAsRead());
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex items-center px-4 gap-3">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors md:hidden"
      >
        <FiMenu className="text-lg" />
      </button>

      {/* Collapse sidebar button (desktop) */}
      <button
        onClick={() => dispatch(toggleSidebarCollapse())}
        className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors hidden md:flex"
      >
        <FiMenu className="text-lg" />
      </button>

      {/* Page title area */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light' : 'Switch to Dark'}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          {isDark ? <FiSun className="text-base" /> : <FiMoon className="text-base" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen((p) => !p); setProfileOpen(false); }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <FiBell className="text-base" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <DropdownMenu isOpen={notifOpen} onClose={() => setNotifOpen(false)} className="w-80">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1"
                >
                  <FiCheck className="text-xs" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">No notifications</div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <NotificationItem key={n.id} item={n} onRead={handleMarkAsRead} />
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/notifications"
                onClick={() => setNotifOpen(false)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View all notifications →
              </Link>
            </div>
          </DropdownMenu>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setProfileOpen((p) => !p); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Avatar name={user?.name || 'User'} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 capitalize mt-0.5">{ (typeof user?.role === 'object' && user?.role !== null ? user?.role?.name : user?.role) || 'staff' }</p>
            </div>
            <FiChevronDown className="text-xs text-slate-400 hidden sm:block" />
          </button>

          <DropdownMenu isOpen={profileOpen} onClose={() => setProfileOpen(false)} className="w-52">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            {[
              { icon: <FiUser />, label: 'My Profile',  to: '/settings/profile' },
              { icon: <FiSettings />, label: 'Settings', to: '/settings' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-100 dark:border-slate-800 mt-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <FiLogOut className="text-base" /> Logout
              </button>
            </div>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
