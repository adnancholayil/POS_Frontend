import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { settingsApi } from './api/services';

// Layout
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import VerifyOtp from './pages/VerifyOtp';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Repairs from './pages/Repairs';
import Customers from './pages/Customers';
import SecondHand from './pages/SecondHand';
import Warranty from './pages/Warranty';
import Staff from './pages/Staff';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Purchases from './pages/Purchases';

import { ToastContainer } from './components/ui/Toast';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Page Level Permission Guard
const PageGuard = ({ page, children }) => {
  const { role } = useAuth();
  const { data: shopSettings } = useQuery({
    queryKey: ['shopSettings'],
    queryFn: () => settingsApi.getShop().then(res => res.data),
  });

  if (!shopSettings) {
    return null; // Don't block screen with flash redirect before settings resolve
  }

  const allowedRoles = shopSettings.pageAccess?.[page] || [];
  if (allowedRoles.includes(role)) {
    return children;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Main Redirect */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<PageGuard page="Dashboard"><Dashboard /></PageGuard>} />

            {/* Products */}
            <Route path="products" element={<PageGuard page="Products"><Products /></PageGuard>} />
            <Route path="products/add" element={<PageGuard page="Products"><Products /></PageGuard>} />
            <Route path="products/categories" element={<PageGuard page="Products"><Products /></PageGuard>} />

            {/* Inventory */}
            <Route path="inventory" element={<PageGuard page="Inventory"><Inventory /></PageGuard>} />
            <Route path="inventory/stock-in" element={<PageGuard page="Inventory"><Inventory /></PageGuard>} />
            <Route path="inventory/stock-out" element={<PageGuard page="Inventory"><Inventory /></PageGuard>} />
            <Route path="inventory/low-stock" element={<PageGuard page="Inventory"><Inventory /></PageGuard>} />
            <Route path="inventory/history" element={<PageGuard page="Inventory"><Inventory /></PageGuard>} />

            {/* Purchases */}
            <Route path="purchases" element={<PageGuard page="Purchases"><Purchases /></PageGuard>} />
            <Route path="purchases/new" element={<PageGuard page="Purchases"><Purchases /></PageGuard>} />
            <Route path="purchases/history" element={<PageGuard page="Purchases"><Purchases /></PageGuard>} />
            <Route path="purchases/suppliers" element={<PageGuard page="Purchases"><Purchases /></PageGuard>} />

            {/* Sales / POS */}
            <Route path="sales" element={<PageGuard page="Sales / POS"><Sales /></PageGuard>} />
            <Route path="sales/pos" element={<PageGuard page="Sales / POS"><Sales /></PageGuard>} />
            <Route path="sales/returns" element={<PageGuard page="Sales / POS"><Sales /></PageGuard>} />

            {/* Repairs */}
            <Route path="repairs" element={<PageGuard page="Service Center"><Repairs /></PageGuard>} />
            <Route path="repairs/new" element={<PageGuard page="Service Center"><Repairs /></PageGuard>} />

            {/* Customers */}
            <Route path="customers" element={<PageGuard page="Customers"><Customers /></PageGuard>} />

            {/* Second Hand */}
            <Route path="second-hand" element={<PageGuard page="Second Hand"><SecondHand /></PageGuard>} />
            <Route path="second-hand/buy" element={<PageGuard page="Second Hand"><SecondHand /></PageGuard>} />

            {/* Warranty */}
            <Route path="warranty" element={<PageGuard page="Warranty"><Warranty /></PageGuard>} />

            {/* Staff */}
            <Route path="staff" element={<PageGuard page="Staff"><Staff /></PageGuard>} />
            <Route path="staff/attendance" element={<PageGuard page="Staff"><Staff /></PageGuard>} />
            <Route path="staff/performance" element={<PageGuard page="Staff"><Staff /></PageGuard>} />

            {/* Tasks */}
            <Route path="tasks" element={<PageGuard page="Tasks"><Tasks /></PageGuard>} />

            {/* Reports */}
            <Route path="reports" element={<PageGuard page="Reports"><Reports /></PageGuard>} />
            <Route path="reports/sales" element={<PageGuard page="Reports"><Reports /></PageGuard>} />
            <Route path="reports/inventory" element={<PageGuard page="Reports"><Reports /></PageGuard>} />
            <Route path="reports/repairs" element={<PageGuard page="Reports"><Reports /></PageGuard>} />
            <Route path="reports/profit" element={<PageGuard page="Reports"><Reports /></PageGuard>} />
            <Route path="reports/staff" element={<PageGuard page="Reports"><Reports /></PageGuard>} />

            {/* Settings */}
            <Route path="settings" element={<PageGuard page="Settings"><Settings /></PageGuard>} />
            <Route path="settings/profile" element={<PageGuard page="Settings"><Settings /></PageGuard>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer />
    </>
  );
}

export default App;
