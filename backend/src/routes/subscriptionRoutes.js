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

// Core Subscription Endpoints
router.post('/subscriptions/from-quotation/:quotationId', verifyAuth, requireRoles(['ADMIN', 'STAFF']), convertFromQuotation);
router.post('/subscriptions', verifyAuth, requireRoles(['ADMIN', 'STAFF']), createSubscription);
router.get('/subscriptions', verifyAuth, requireRoles(['ADMIN', 'STAFF']), listSubscriptions);
router.get('/subscriptions/:id', verifyAuth, requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), getSubscription);
router.put('/subscriptions/:id', verifyAuth, requireRoles(['ADMIN', 'STAFF']), updateSubscription);

// Lifecycle Transition Actions
router.post('/subscriptions/:id/confirm', verifyAuth, requireRoles(['ADMIN', 'STAFF']), confirmSubscription);
router.post('/subscriptions/:id/activate', verifyAuth, requireRoles(['ADMIN', 'STAFF']), activateSubscription);
router.post('/subscriptions/:id/pause', verifyAuth, requireRoles(['ADMIN', 'STAFF']), pauseSubscription);
router.post('/subscriptions/:id/resume', verifyAuth, requireRoles(['ADMIN', 'STAFF']), resumeSubscription);
router.post('/subscriptions/:id/renew', verifyAuth, requireRoles(['ADMIN', 'STAFF']), renewSubscription);
router.post('/subscriptions/:id/cancel', verifyAuth, requireRoles(['ADMIN', 'STAFF']), cancelSubscription);
router.post('/subscriptions/:id/close', verifyAuth, requireRoles(['ADMIN', 'STAFF']), closeSubscription);

// Lifecycle History Audit Log
router.get('/subscriptions/:id/history', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getSubscriptionHistory);

export default router;

