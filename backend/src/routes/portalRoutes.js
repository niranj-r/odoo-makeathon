import express from 'express';
import {
  getPortalDashboard,
  getPortalProfile,
  updatePortalProfile,
  getPortalSubscriptions,
  getPortalSubscriptionById,
  renewPortalSubscription,
  pausePortalSubscription,
  cancelPortalSubscription,
  getPortalInvoices,
  getPortalInvoiceById,
  getPortalPayments,
  getPortalPlans,
} from '../controllers/portalController.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();

// Publicly available plans
router.get('/plans', getPortalPlans);

// Authenticated Customer Portal Endpoints
router.get('/dashboard', verifyAuth, getPortalDashboard);
router.get('/profile', verifyAuth, getPortalProfile);
router.put('/profile', verifyAuth, updatePortalProfile);

router.get('/subscriptions', verifyAuth, getPortalSubscriptions);
router.get('/subscriptions/:id', verifyAuth, getPortalSubscriptionById);
router.post('/subscriptions/:id/renew', verifyAuth, renewPortalSubscription);
router.post('/subscriptions/:id/pause', verifyAuth, pausePortalSubscription);
router.post('/subscriptions/:id/cancel', verifyAuth, cancelPortalSubscription);

router.get('/invoices', verifyAuth, getPortalInvoices);
router.get('/invoices/:id', verifyAuth, getPortalInvoiceById);

router.get('/payments', verifyAuth, getPortalPayments);

export default router;
