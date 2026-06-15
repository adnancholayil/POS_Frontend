import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { ToastContainer } from '../components/ui/Toast';
import { selectSidebarOpen, selectSidebarCollapsed, setSidebarOpen, toggleSidebar } from '../features/ui/uiSlice';
import { cn } from '../utils/helpers';
import { useSocket } from '../hooks/useSocket';

export const DashboardLayout = () => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const sidebarCollapsed = useSelector(selectSidebarCollapsed);

  // Establish the authenticated WebSocket connection for real-time notifications
  useSocket();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <Sidebar
        isOpen={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => dispatch(setSidebarOpen(false))}
      />
      <div className={cn(
        'transition-all duration-300 flex flex-col min-h-screen',
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
      )}>
        <Navbar onMenuClick={() => dispatch(toggleSidebar())} />
        <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};
