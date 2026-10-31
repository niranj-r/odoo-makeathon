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

// Member 1 Feature Pages: Products, Plans & Users
import ProductList from '../pages/admin/ProductList';
import ProductCreate from '../pages/admin/ProductCreate';
import ProductDetail from '../pages/admin/ProductDetail';
import ProductEdit from '../pages/admin/ProductEdit';
import VariantList from '../pages/admin/VariantList';
import SubscriptionPlanList from '../pages/admin/SubscriptionPlanList';
import SubscriptionPlanCreate from '../pages/admin/SubscriptionPlanCreate';
import SubscriptionPlanDetail from '../pages/admin/SubscriptionPlanDetail';
import SubscriptionPlanEdit from '../pages/admin/SubscriptionPlanEdit';
import UserManagement from '../pages/admin/UserManagement';
import StaffManagement from '../pages/admin/StaffManagement';

// Member 2 Feature Pages: Customer, Quotations & Subscriptions
import CustomerList from '../pages/staff/customers/CustomerList';
import CustomerDetail from '../pages/staff/customers/CustomerDetail';
import TemplateList from '../pages/staff/templates/TemplateList';
import QuotationList from '../pages/staff/quotations/QuotationList';
import QuotationBuilder from '../pages/staff/quotations/QuotationBuilder';
import QuotationDetail from '../pages/staff/quotations/QuotationDetail';
import SubscriptionList from '../pages/staff/subscriptions/SubscriptionList';
import SubscriptionDetail from '../pages/staff/subscriptions/SubscriptionDetail';

// Member 3 Feature Pages: Invoices, Billing & Payments
import InvoiceList from '../pages/staff/invoices/InvoiceList';
import InvoiceCreate from '../pages/staff/invoices/InvoiceCreate';
import InvoiceDetail from '../pages/staff/invoices/InvoiceDetail';
import PaymentList from '../pages/staff/payments/PaymentList';
import RecordPayment from '../pages/staff/payments/RecordPayment';
import PaymentHistory from '../pages/staff/payments/PaymentHistory';

// Customer Portal Pages
import CustomerInvoices from '../pages/customer/CustomerInvoices';
import CustomerPayments from '../pages/customer/CustomerPayments';

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

        {/* Member 1: Products */}
        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductCreate />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="products/:id/edit" element={<ProductEdit />} />
        <Route path="variants" element={<VariantList />} />

        {/* Member 1: Subscription Plans */}
        <Route path="subscription-plans" element={<SubscriptionPlanList />} />
        <Route path="subscription-plans/new" element={<SubscriptionPlanCreate />} />
        <Route path="subscription-plans/:id" element={<SubscriptionPlanDetail />} />
        <Route path="subscription-plans/:id/edit" element={<SubscriptionPlanEdit />} />

        {/* Member 1: User & Staff Management */}
        <Route path="users" element={<UserManagement />} />
        <Route path="staff" element={<StaffManagement />} />
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

        {/* Member 2: Customer Management */}
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/:id" element={<CustomerDetail />} />

        {/* Member 2: Quotation Templates */}
        <Route path="templates" element={<TemplateList />} />

        {/* Member 2: Quotations */}
        <Route path="quotations" element={<QuotationList />} />
        <Route path="quotations/new" element={<QuotationBuilder />} />
        <Route path="quotations/:id" element={<QuotationDetail />} />

        {/* Member 2: Subscriptions */}
        <Route path="subscriptions" element={<SubscriptionList />} />
        <Route path="subscriptions/:id" element={<SubscriptionDetail />} />

        {/* Member 3: Invoices & Billing */}
        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/new" element={<InvoiceCreate />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />

        {/* Member 3: Payments */}
        <Route path="payments" element={<PaymentList />} />
        <Route path="payments/new" element={<RecordPayment />} />
        <Route path="payments/history" element={<PaymentHistory />} />
      </Route>

      {/* Protected Customer Portal Routes */}
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
        <Route path="invoices" element={<CustomerInvoices />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="payments" element={<CustomerPayments />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
