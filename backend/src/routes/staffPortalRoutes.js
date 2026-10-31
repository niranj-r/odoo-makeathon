import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import { requirePermission } from '../middleware/permissions.js';
import {
  getStaffDashboardOverview,
  getStaffDashboardActivities,
  getStaffDashboardAlerts,
  listCustomers,
  getCustomerById,
  updateCustomer,
  listQuotations,
  getQuotationById,
  createQuotation,
  updateQuotationStatus,
  listSubscriptions,
  getSubscriptionById,
  createSubscription,
  cancelSubscriptionRequest,
  changePlanRequest,
  listInvoices,
  getInvoiceById,
  sendInvoiceToCustomer,
  listPayments,
  getPaymentById,
  retryPayment,
  getStaffProfile,
  updateStaffProfile
} from '../controllers/staffPortalController.js';

const router = Router();

// Staff portal routes require verified session and STAFF or ADMIN role
router.use(verifyAuth, requireRoles(['STAFF', 'ADMIN']));

// 1. Staff Dashboard
router.get('/dashboard/overview', getStaffDashboardOverview);
router.get('/dashboard/activities', getStaffDashboardActivities);
router.get('/dashboard/alerts', getStaffDashboardAlerts);

// 2. Customers
router.get('/customers', requirePermission('customers.view'), listCustomers);
router.get('/customers/:id', requirePermission('customers.view'), getCustomerById);
router.patch('/customers/:id', requirePermission('customers.update'), updateCustomer);

// 3. Quotations
router.get('/quotations', requirePermission('quotations.view'), listQuotations);
router.get('/quotations/:id', requirePermission('quotations.view'), getQuotationById);
router.post('/quotations', requirePermission('quotations.create'), createQuotation);
router.patch('/quotations/:id', requirePermission('quotations.update_draft'), updateQuotationStatus);

// 4. Subscriptions
router.get('/subscriptions', requirePermission('subscriptions.view'), listSubscriptions);
router.get('/subscriptions/:id', requirePermission('subscriptions.view'), getSubscriptionById);
router.post('/subscriptions', requirePermission('subscriptions.create'), createSubscription);
router.post('/subscriptions/:id/cancel-request', requirePermission('subscriptions.request_cancel'), cancelSubscriptionRequest);
router.post('/subscriptions/:id/change-plan-request', requirePermission('subscriptions.request_plan_change'), changePlanRequest);

// 5. Invoices
router.get('/invoices', requirePermission('invoices.view'), listInvoices);
router.get('/invoices/:id', requirePermission('invoices.view'), getInvoiceById);
router.post('/invoices/:id/send', requirePermission('invoices.send'), sendInvoiceToCustomer);

// 6. Payments
router.get('/payments', requirePermission('payments.view'), listPayments);
router.get('/payments/:id', requirePermission('payments.view'), getPaymentById);
router.post('/payments/:id/retry', requirePermission('payments.retry'), retryPayment);

// 7. Profile
router.get('/profile', requirePermission('profile.view_own'), getStaffProfile);
router.patch('/profile', requirePermission('profile.update_own'), updateStaffProfile);

export default router;

