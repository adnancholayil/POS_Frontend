import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

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

import { ToastContainer } from './components/ui/Toast';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
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
            <Route path="dashboard" element={<Dashboard />} />

            {/* Products */}
            <Route path="products" element={<Products />} />
            <Route path="products/add" element={<Products />} />
            <Route path="products/categories" element={<Products />} />

            {/* Inventory */}
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory/stock-in" element={<Inventory />} />
            <Route path="inventory/stock-out" element={<Inventory />} />
            <Route path="inventory/low-stock" element={<Inventory />} />
            <Route path="inventory/history" element={<Inventory />} />

            {/* Sales / POS */}
            <Route path="sales" element={<Sales />} />
            <Route path="sales/pos" element={<Sales />} />
            <Route path="sales/returns" element={<Sales />} />

            {/* Repairs */}
            <Route path="repairs" element={<Repairs />} />
            <Route path="repairs/new" element={<Repairs />} />

            {/* Customers */}
            <Route path="customers" element={<Customers />} />

            {/* Second Hand */}
            <Route path="second-hand" element={<SecondHand />} />
            <Route path="second-hand/buy" element={<SecondHand />} />

            {/* Warranty */}
            <Route path="warranty" element={<Warranty />} />

            {/* Staff */}
            <Route path="staff" element={<Staff />} />
            <Route path="staff/attendance" element={<Staff />} />
            <Route path="staff/performance" element={<Staff />} />

            {/* Tasks */}
            <Route path="tasks" element={<Tasks />} />

            {/* Reports */}
            <Route path="reports" element={<Reports />} />
            <Route path="reports/sales" element={<Reports />} />
            <Route path="reports/inventory" element={<Reports />} />
            <Route path="reports/repairs" element={<Reports />} />
            <Route path="reports/profit" element={<Reports />} />
            <Route path="reports/staff" element={<Reports />} />

            {/* Settings */}
            <Route path="settings" element={<Settings />} />
            <Route path="settings/profile" element={<Settings />} />
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
