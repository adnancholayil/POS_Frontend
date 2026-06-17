import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { selectSidebarOpen, selectSidebarCollapsed, setSidebarOpen, toggleSidebar } from '../features/ui/uiSlice';
import { cn } from '../utils/helpers';
import { useSocket } from '../hooks/useSocket';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api/services';

export const DashboardLayout = () => {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const sidebarCollapsed = useSelector(selectSidebarCollapsed);

  // Establish the authenticated WebSocket connection for real-time notifications
  useSocket();

  // Load shop settings to apply customization theme
  const { data: shopSettings } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: () => settingsApi.getShop().then(res => res.data),
  });

  React.useEffect(() => {
    if (shopSettings) {
      const primaryType = shopSettings.primaryColorType || 'solid';
      const primarySolid = shopSettings.primaryColorSolid || '#2563eb';
      const primaryGradient = shopSettings.primaryColorGradient || { from: '#06b6d4', to: '#3b82f6', angle: '135deg' };

      const secondaryType = shopSettings.secondaryColorType || 'solid';
      const secondarySolid = shopSettings.secondaryColorSolid || '#8b5cf6';
      const secondaryGradient = shopSettings.secondaryColorGradient || { from: '#8b5cf6', to: '#ec4899', angle: '135deg' };

      const pColor = primaryType === 'solid' ? primarySolid : primaryGradient.from;
      const pColorTo = primaryType === 'solid' ? primarySolid : primaryGradient.to;
      const pStyle = primaryType === 'solid' ? primarySolid : `linear-gradient(${primaryGradient.angle}, ${primaryGradient.from}, ${primaryGradient.to})`;

      const sColor = secondaryType === 'solid' ? secondarySolid : secondaryGradient.from;
      const sColorTo = secondaryType === 'solid' ? secondarySolid : secondaryGradient.to;
      const sStyle = secondaryType === 'solid' ? secondarySolid : `linear-gradient(${secondaryGradient.angle}, ${secondaryGradient.from}, ${secondaryGradient.to})`;

      let styleTag = document.getElementById('website-custom-theme');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'website-custom-theme';
        document.head.appendChild(styleTag);
      }

      styleTag.innerHTML = `
        :root {
          --primary: ${pColor} !important;
          --primary-h: ${pColorTo} !important;
          --primary-soft: ${pColor}15 !important;
          --secondary: ${sColor} !important;
          --secondary-h: ${sColorTo} !important;
          --secondary-soft: ${sColor}15 !important;
        }
        
        /* Class overrides for primary theme */
        .bg-blue-600, .btn-primary {
          background: ${pStyle} !important;
          color: #ffffff !important;
        }
        .bg-blue-50 {
          background-color: ${pColor}15 !important;
        }
        .text-blue-600 {
          color: ${pColor} !important;
        }
        .border-blue-600 {
          border-color: ${pColor} !important;
        }
        
        /* Dark mode overrides for primary theme */
        .dark .dark\\:bg-blue-900\\/20, .dark .bg-blue-900\\/20 {
          background-color: ${pColor}20 !important;
        }
        .dark .dark\\:text-blue-400, .dark .text-blue-400 {
          color: ${pColor} !important;
        }
        .dark .dark\\:border-blue-900, .dark .border-blue-900 {
          border-color: ${pColor}40 !important;
        }

        /* Class overrides for secondary theme */
        .bg-indigo-600, .bg-purple-600, .bg-violet-600 {
          background: ${sStyle} !important;
          color: #ffffff !important;
        }
        .bg-indigo-50, .bg-purple-50, .bg-violet-50 {
          background-color: ${sColor}15 !important;
        }
        .text-indigo-600, .text-purple-600, .text-violet-600 {
          color: ${sColor} !important;
        }
        .border-indigo-600, .border-purple-600, .border-violet-600 {
          border-color: ${sColor} !important;
        }

        /* Dark mode overrides for secondary theme */
        .dark .dark\\:bg-indigo-900\\/20, .dark .bg-indigo-900\\/20, .dark .bg-purple-900\\/20, .dark .bg-violet-900\\/20 {
          background-color: ${sColor}20 !important;
        }
        .dark .dark\\:text-indigo-400, .dark .text-indigo-400, .dark .text-purple-400, .dark .text-violet-400 {
          color: ${sColor} !important;
        }
      `;
    }
  }, [shopSettings]);

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
    </div>
  );
};
