import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import {
  convertFromQuotation,
  createSubscription,
  listSubscriptions,
  getSubscription,
  updateSubscription
} from '../controllers/subscriptionController.js';
import {
  confirmSubscription,
  activateSubscription,
  pauseSubscription,
  resumeSubscription,
  renewSubscription,
  cancelSubscription,
  closeSubscription,
  getSubscriptionHistory
} from '../controllers/subscriptionLifecycleController.js';

const router = Router();

// Core Subscription Endpoints (Supports both mount styles)
router.post(['/from-quotation/:quotationId', '/subscriptions/from-quotation/:quotationId'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), convertFromQuotation);
router.post(['/', '/subscriptions'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), createSubscription);
router.get(['/', '/subscriptions'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), listSubscriptions);
router.get(['/:id', '/subscriptions/:id'], verifyAuth, requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), getSubscription);
router.put(['/:id', '/subscriptions/:id'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), updateSubscription);

// Lifecycle Transition Actions
router.post(['/:id/confirm', '/subscriptions/:id/confirm'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), confirmSubscription);
router.post(['/:id/activate', '/subscriptions/:id/activate'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), activateSubscription);
router.post(['/:id/pause', '/subscriptions/:id/pause'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), pauseSubscription);
router.post(['/:id/resume', '/subscriptions/:id/resume'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), resumeSubscription);
router.post(['/:id/renew', '/subscriptions/:id/renew'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), renewSubscription);
router.post(['/:id/cancel', '/subscriptions/:id/cancel'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), cancelSubscription);
router.post(['/:id/close', '/subscriptions/:id/close'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), closeSubscription);

// Lifecycle History Audit Log
router.get(['/:id/history', '/subscriptions/:id/history'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), getSubscriptionHistory);

export default router;
