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

// Dashboards
import AdminDashboard from '../pages/admin/Dashboard';
import StaffDashboard from '../pages/staff/Dashboard';
import CustomerDashboard from '../pages/customer/Dashboard';

// Member 2 Feature Pages: Customer Management
import CustomerList from '../pages/staff/customers/CustomerList';
import CustomerDetail from '../pages/staff/customers/CustomerDetail';

// Member 2 Feature Pages: Quotation Templates
import TemplateList from '../pages/staff/templates/TemplateList';

// Member 2 Feature Pages: Quotation Management
import QuotationList from '../pages/staff/quotations/QuotationList';
import QuotationBuilder from '../pages/staff/quotations/QuotationBuilder';
import QuotationDetail from '../pages/staff/quotations/QuotationDetail';

// Member 2 Feature Pages: Subscription Management
import SubscriptionList from '../pages/staff/subscriptions/SubscriptionList';
import SubscriptionDetail from '../pages/staff/subscriptions/SubscriptionDetail';

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
      </Route>

      {/* Protected Staff Routes (Commercial Engine - Member 2) */}
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

        {/* Customer Management */}
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/:id" element={<CustomerDetail />} />

        {/* Quotation Templates */}
        <Route path="templates" element={<TemplateList />} />

        {/* Quotations */}
        <Route path="quotations" element={<QuotationList />} />
        <Route path="quotations/new" element={<QuotationBuilder />} />
        <Route path="quotations/:id" element={<QuotationDetail />} />

        {/* Subscriptions */}
        <Route path="subscriptions" element={<SubscriptionList />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetail />} />
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
        <Route path="quotations" element={<QuotationList />} />
        <Route path="quotations/:id" element={<QuotationDetail />} />
        <Route path="subscriptions" element={<SubscriptionList />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetail />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
