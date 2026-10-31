import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import StaffLayout from '../layouts/StaffLayout';
import CustomerLayout from '../layouts/CustomerLayout';

// Auth Pages (Lazy loaded for optimal code-splitting)
const Login = React.lazy(() => import('../pages/auth/Login'));
const Register = React.lazy(() => import('../pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('../pages/auth/ResetPassword'));

// Dashboards & Modules (Lazy loaded)
const AdminDashboard = React.lazy(() => import('../pages/admin/Dashboard'));
const AdminAnalytics = React.lazy(() => import('../pages/admin/Analytics'));
const AdminReports = React.lazy(() => import('../pages/admin/Reports'));
const StaffDashboard = React.lazy(() => import('../pages/staff/Dashboard'));

// Customer Portal Pages (Lazy loaded)
const CustomerDashboard = React.lazy(() => import('../pages/customer/Dashboard'));
const CustomerBrowsePlans = React.lazy(() => import('../pages/customer/BrowsePlans'));
const CustomerSubscriptions = React.lazy(() => import('../pages/customer/Subscriptions'));
const CustomerInvoices = React.lazy(() => import('../pages/customer/Invoices'));
const CustomerPayments = React.lazy(() => import('../pages/customer/Payments'));
const CustomerProfile = React.lazy(() => import('../pages/customer/Profile'));

/**
 * Minimal Suspense Loading Fallback
 */
const PageLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center p-8 select-none">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        Loading Workspace...
      </span>
    </div>
  </div>
);

// Helper component for root '/' navigation
const RootRedirect = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (role === 'STAFF') {
    return <Navigate to="/staff/dashboard" replace />;
  }
  return <Navigate to="/customer/dashboard" replace />;
};

// 404 & Unauthorized Page
const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 select-none">
      <h1 className="text-6xl font-black text-blue-600 dark:text-blue-400">404</h1>
      <p className="text-slate-600 dark:text-slate-300 mt-2 font-medium">
        The page you are looking for does not exist.
      </p>
      <a
        href="/"
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
      >
        Return to Home
      </a>
    </div>
  );
};

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Root Path Handler */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* Protected Staff Routes */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
        </Route>

        {/* Protected Customer Routes (/customer/*) */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/customer/dashboard" replace />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="browse-plans" element={<CustomerBrowsePlans />} />
          <Route path="subscriptions" element={<CustomerSubscriptions />} />
          <Route path="invoices" element={<CustomerInvoices />} />
          <Route path="payments" element={<CustomerPayments />} />
          <Route path="profile" element={<CustomerProfile />} />
        </Route>

        {/* Backward-compatible /portal alias routes */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
              <CustomerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/customer/dashboard" replace />} />
          <Route path="dashboard" element={<Navigate to="/customer/dashboard" replace />} />
          <Route path="browse-plans" element={<Navigate to="/customer/browse-plans" replace />} />
          <Route path="subscriptions" element={<Navigate to="/customer/subscriptions" replace />} />
          <Route path="invoices" element={<Navigate to="/customer/invoices" replace />} />
          <Route path="payments" element={<Navigate to="/customer/payments" replace />} />
          <Route path="profile" element={<Navigate to="/customer/profile" replace />} />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
