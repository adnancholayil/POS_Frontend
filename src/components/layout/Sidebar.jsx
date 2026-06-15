import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiBox, FiPackage, FiShoppingCart, FiTool, FiUsers,
  FiUserCheck, FiCheckSquare, FiBarChart2, FiSettings, FiShield,
  FiSmartphone, FiRepeat, FiChevronDown, FiChevronRight, FiX, FiLogOut,
} from 'react-icons/fi';
import { useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { setSidebarOpen } from '../../features/ui/uiSlice';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/Badge';
import { cn } from '../../utils/helpers';
import { useState } from 'react';

const APP_NAME = 'Galaxy POS';

const navItems = [
  { label: 'Dashboard',    icon: <FiGrid />,       path: '/dashboard',    roles: ['admin','manager','salesman'] },
  {
    label: 'Products',     icon: <FiBox />,
    roles: ['admin','manager'],
    children: [
      { label: 'All Products',  path: '/products' },
      { label: 'Add Product',   path: '/products/add' },
      { label: 'Categories',    path: '/products/categories' },
    ],
  },
  {
    label: 'Inventory',    icon: <FiPackage />,
    roles: ['admin','manager'],
    children: [
      { label: 'Stock Overview', path: '/inventory' },
      { label: 'Stock In',       path: '/inventory/stock-in' },
      { label: 'Stock Out',      path: '/inventory/stock-out' },
      { label: 'Low Stock',      path: '/inventory/low-stock' },
      { label: 'History',        path: '/inventory/history' },
    ],
  },
  {
    label: 'Sales / POS',  icon: <FiShoppingCart />,
    roles: ['admin','manager','salesman'],
    children: [
      { label: 'POS Billing',    path: '/sales/pos' },
      { label: 'Sales History',  path: '/sales' },
      { label: 'Returns',        path: '/sales/returns' },
    ],
  },
  {
    label: 'Service Center', icon: <FiTool />,
    roles: ['admin','manager','salesman'],
    children: [
      { label: 'All Repairs',     path: '/repairs' },
      { label: 'New Ticket',      path: '/repairs/new' },
    ],
  },
  { label: 'Customers',    icon: <FiUsers />,      path: '/customers',    roles: ['admin','manager','salesman'] },
  {
    label: 'Second Hand',  icon: <FiRepeat />,
    roles: ['admin','manager'],
    children: [
      { label: 'All Devices',    path: '/second-hand' },
      { label: 'Buy Device',     path: '/second-hand/buy' },
    ],
  },
  { label: 'Warranty',     icon: <FiShield />,     path: '/warranty',     roles: ['admin','manager'] },
  {
    label: 'Staff',        icon: <FiUserCheck />,
    roles: ['admin','manager'],
    children: [
      { label: 'All Staff',      path: '/staff' },
      { label: 'Attendance',     path: '/staff/attendance' },
      { label: 'Performance',    path: '/staff/performance' },
    ],
  },
  { label: 'Tasks',        icon: <FiCheckSquare />,path: '/tasks',        roles: ['admin','manager','salesman'] },
  {
    label: 'Reports',      icon: <FiBarChart2 />,
    roles: ['admin','manager'],
    children: [
      { label: 'Sales Report',    path: '/reports/sales' },
      { label: 'Inventory Report',path: '/reports/inventory' },
      { label: 'Repair Report',   path: '/reports/repairs' },
      { label: 'Profit Report',   path: '/reports/profit' },
      { label: 'Staff Report',    path: '/reports/staff' },
    ],
  },
  { label: 'Settings',     icon: <FiSettings />,   path: '/settings',     roles: ['admin','manager','salesman'] },
];

const NavItem = ({ item, collapsed }) => {
  const location = useLocation();
  const isActive = item.path
    ? location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    : item.children?.some((c) => location.pathname === c.path || location.pathname.startsWith(c.path + '/'));

  const [open, setOpen] = useState(isActive);

  React.useEffect(() => {
    setOpen(isActive);
  }, [isActive]);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen((p) => !p)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
            isActive
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-800 dark:hover:text-slate-200'
          )}
        >
          <span className="text-base shrink-0">{item.icon}</span>
          {!collapsed && (
            <>
              <span className="flex-1 text-left leading-tight">{item.label}</span>
              <span className="text-xs opacity-60">{open ? <FiChevronDown /> : <FiChevronRight />}</span>
            </>
          )}
        </button>
        <AnimatePresence initial={false}>
          {open && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 dark:border-slate-700 pl-3 pb-1">
                {item.children.map((child) => (
                  <NavLink
                    key={child.path}
                    to={child.path}
                    end
                    className={({ isActive: a }) => cn(
                      'block px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                      a
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200'
                    )}
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={({ isActive: a }) => cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        a
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-800 dark:hover:text-slate-200'
      )}
    >
      <span className="text-base shrink-0">{item.icon}</span>
      {!collapsed && <span className="leading-tight">{item.label}</span>}
    </NavLink>
  );
};

export const Sidebar = ({ isOpen, collapsed, onClose }) => {
  const dispatch = useDispatch();
  const { user, role } = useAuth();

  const filteredItems = navItems.filter((item) => item.roles?.includes(role));

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        'fixed top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col z-40 transition-all duration-300 shadow-sm',
        collapsed ? 'w-16' : 'w-64',
        'max-md:shadow-xl',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}>
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 px-4 h-16 border-b border-slate-100 dark:border-slate-800 shrink-0',
          collapsed && 'justify-center px-2'
        )}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <FiSmartphone className="text-white text-base" />
          </div>
          {!collapsed && (
            <span className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">{APP_NAME}</span>
          )}
          <button
            onClick={onClose}
            className="ml-auto md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FiX />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-0.5 no-scrollbar">
          {filteredItems.map((item) => (
            <NavItem key={item.label} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* User footer */}
        <div className={cn(
          'shrink-0 border-t border-slate-100 dark:border-slate-800 p-3',
          collapsed ? 'flex justify-center' : ''
        )}>
          {!collapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <Avatar name={user?.name || 'User'} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 capitalize">{ (typeof user?.role === 'object' && user?.role !== null ? user?.role?.name : user?.role) || 'staff' }</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <FiLogOut className="text-sm" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <FiLogOut className="text-base" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
