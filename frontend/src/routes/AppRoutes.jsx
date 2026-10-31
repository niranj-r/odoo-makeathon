import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import StaffLayout from '../layouts/StaffLayout';
import CustomerLayout from '../layouts/CustomerLayout';

// Auth Pages (Lazy loaded)
const Login = React.lazy(() => import('../pages/auth/Login'));
const Register = React.lazy(() => import('../pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('../pages/auth/ResetPassword'));

// Member 4 Admin Pages: Dashboard, Analytics, Reports
const AdminDashboard = React.lazy(() => import('../pages/admin/Dashboard'));
const AdminAnalytics = React.lazy(() => import('../pages/admin/Analytics'));
const AdminReports = React.lazy(() => import('../pages/admin/Reports'));

// Member 1 Admin Pages: Products, Variants, Plans, Discounts, Taxes, Staff & Users
const ProductList = React.lazy(() => import('../pages/admin/ProductList'));
const ProductCreate = React.lazy(() => import('../pages/admin/ProductCreate'));
const ProductDetail = React.lazy(() => import('../pages/admin/ProductDetail'));
const ProductEdit = React.lazy(() => import('../pages/admin/ProductEdit'));
const VariantList = React.lazy(() => import('../pages/admin/VariantList'));
const SubscriptionPlanList = React.lazy(() => import('../pages/admin/SubscriptionPlanList'));
const SubscriptionPlanCreate = React.lazy(() => import('../pages/admin/SubscriptionPlanCreate'));
const SubscriptionPlanDetail = React.lazy(() => import('../pages/admin/SubscriptionPlanDetail'));
const SubscriptionPlanEdit = React.lazy(() => import('../pages/admin/SubscriptionPlanEdit'));
const DiscountList = React.lazy(() => import('../pages/admin/DiscountList'));
const DiscountCreate = React.lazy(() => import('../pages/admin/DiscountCreate'));
const DiscountDetail = React.lazy(() => import('../pages/admin/DiscountDetail'));
const DiscountEdit = React.lazy(() => import('../pages/admin/DiscountEdit'));
const TaxList = React.lazy(() => import('../pages/admin/TaxList'));
const TaxCreate = React.lazy(() => import('../pages/admin/TaxCreate'));
const TaxDetail = React.lazy(() => import('../pages/admin/TaxDetail'));
const TaxEdit = React.lazy(() => import('../pages/admin/TaxEdit'));
const UserManagement = React.lazy(() => import('../pages/admin/UserManagement'));
const StaffManagement = React.lazy(() => import('../pages/admin/StaffManagement'));
const StaffCreate = React.lazy(() => import('../pages/admin/StaffCreate'));
const StaffDetail = React.lazy(() => import('../pages/admin/StaffDetail'));
const StaffEdit = React.lazy(() => import('../pages/admin/StaffEdit'));

// Staff Pages: Dashboard & Profiles
const StaffDashboard = React.lazy(() => import('../pages/staff/Dashboard'));
const StaffProfile = React.lazy(() => import('../pages/staff/StaffProfile'));

// Member 2 Staff Pages: Customers, Templates, Quotations, Subscriptions
const CustomerList = React.lazy(() => import('../pages/staff/customers/CustomerList'));
const CustomerDetail = React.lazy(() => import('../pages/staff/customers/CustomerDetail'));
const TemplateList = React.lazy(() => import('../pages/staff/templates/TemplateList'));
const QuotationList = React.lazy(() => import('../pages/staff/quotations/QuotationList'));
const QuotationBuilder = React.lazy(() => import('../pages/staff/quotations/QuotationBuilder'));
const QuotationDetail = React.lazy(() => import('../pages/staff/quotations/QuotationDetail'));
const SubscriptionList = React.lazy(() => import('../pages/staff/subscriptions/SubscriptionList'));
const SubscriptionDetail = React.lazy(() => import('../pages/staff/subscriptions/SubscriptionDetail'));

// Member 3 Staff Pages: Invoices, Billing, Payments
const InvoiceList = React.lazy(() => import('../pages/staff/invoices/InvoiceList'));
const InvoiceCreate = React.lazy(() => import('../pages/staff/invoices/InvoiceCreate'));
const InvoiceDetail = React.lazy(() => import('../pages/staff/invoices/InvoiceDetail'));
const PaymentList = React.lazy(() => import('../pages/staff/payments/PaymentList'));
const RecordPayment = React.lazy(() => import('../pages/staff/payments/RecordPayment'));
const PaymentHistory = React.lazy(() => import('../pages/staff/payments/PaymentHistory'));

// Member 4 Customer Portal Pages
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
      <div className="w-8 h-8 border-2 border-primary-navy border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Loading Workspace...
      </span>
    </div>
  </div>
);

// Helper component for root '/' navigation
const RootRedirect = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-navy border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Initializing Session...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = (role || 'CUSTOMER').toUpperCase();
  if (normalizedRole === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (normalizedRole === 'STAFF') {
    return <Navigate to="/staff/dashboard" replace />;
  } else {
    return <Navigate to="/customer/dashboard" replace />;
  }
};

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <div className="text-center max-w-md bg-white p-8 rounded-xl border border-sand-border shadow-sm">
      <h2 className="text-4xl font-extrabold text-primary-navy mb-2">404</h2>
      <p className="text-slate-600 mb-6 font-medium">The requested page does not exist or has been moved.</p>
      <a
        href="/"
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-navy text-white text-sm font-semibold hover:bg-navy-dark transition-colors"
      >
        Return to Portal
      </a>
    </div>
  </div>
);

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

          {/* Member 1: Products & Variants */}
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

          {/* Member 1: Discounts & Taxes */}
          <Route path="discounts" element={<DiscountList />} />
          <Route path="discounts/new" element={<DiscountCreate />} />
          <Route path="discounts/:id" element={<DiscountDetail />} />
          <Route path="discounts/:id/edit" element={<DiscountEdit />} />
          <Route path="taxes" element={<TaxList />} />
          <Route path="taxes/new" element={<TaxCreate />} />
          <Route path="taxes/:id" element={<TaxDetail />} />
          <Route path="taxes/:id/edit" element={<TaxEdit />} />

          {/* Member 1: User & Staff Management */}
          <Route path="users" element={<UserManagement />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="staff/new" element={<StaffCreate />} />
          <Route path="staff/:id" element={<StaffDetail />} />
          <Route path="staff/:id/edit" element={<StaffEdit />} />
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
          <Route path="profile" element={<StaffProfile />} />

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

        {/* Protected Customer Routes */}
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
