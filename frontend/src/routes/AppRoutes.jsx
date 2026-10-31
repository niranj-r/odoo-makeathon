import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import StaffLayout from '../layouts/StaffLayout';
import CustomerLayout from '../layouts/CustomerLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Dashboards & Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import UserManagement from '../pages/admin/UserManagement';
import StaffManagement from '../pages/admin/StaffManagement';
import ProductList from '../pages/admin/ProductList';
import ProductCreate from '../pages/admin/ProductCreate';
import ProductDetail from '../pages/admin/ProductDetail';
import ProductEdit from '../pages/admin/ProductEdit';
import VariantList from '../pages/admin/VariantList';
import SubscriptionPlanList from '../pages/admin/SubscriptionPlanList';
import SubscriptionPlanCreate from '../pages/admin/SubscriptionPlanCreate';
import SubscriptionPlanDetail from '../pages/admin/SubscriptionPlanDetail';
import SubscriptionPlanEdit from '../pages/admin/SubscriptionPlanEdit';
import StaffDashboard from '../pages/staff/Dashboard';
import CustomerDashboard from '../pages/customer/Dashboard';

// Helper component for root '/' navigation
const RootRedirect = () => {
  const { user, role, loading } = useAuth();

  if (loading || (user && !role)) {
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
  return <Navigate to="/portal/dashboard" replace />;
};

// 404 & Unauthorized Page
const NotFound = () => {
  return (
    <div className="loading-container">
      <h1 style={{ fontSize: '3rem', color: 'var(--primary-navy)' }}>404</h1>
      <p>The page you are looking for does not exist.</p>
      <a href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
        Return to Home
      </a>
    </div>
  );
};

export const AppRoutes = () => {
  return (
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
        <Route path="users" element={<UserManagement />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductCreate />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="products/:id/edit" element={<ProductEdit />} />
        <Route path="variants" element={<VariantList />} />
        <Route path="subscription-plans" element={<SubscriptionPlanList />} />
        <Route path="subscription-plans/new" element={<SubscriptionPlanCreate />} />
        <Route path="subscription-plans/:id" element={<SubscriptionPlanDetail />} />
        <Route path="subscription-plans/:id/edit" element={<SubscriptionPlanEdit />} />
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

      {/* Protected Customer Routes */}
      <Route
        path="/portal"
        element={
          <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/portal/dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;

