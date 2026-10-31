import express from 'express';
import {
  listSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  updateSubscriptionPlanStatus
} from '../controllers/subscriptionPlanController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole, requireRoles } from '../middleware/roles.js';

const router = express.Router();

/**
 * All subscription plan routes require authentication
 */
router.use(verifyAuth);

/**
 * GET /api/subscription-plans
 * List subscription plans with filtering and pagination.
 * Accessible by ADMIN and STAFF (and active plans by CUSTOMER).
 */
router.get('/', requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), listSubscriptionPlans);

/**
 * GET /api/subscription-plans/:id
 * Retrieve details for a single subscription plan.
 * Accessible by ADMIN and STAFF (and active plans by CUSTOMER).
 */
router.get('/:id', requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), getSubscriptionPlanById);

/**
 * POST /api/subscription-plans
 * Create a new subscription plan.
 * Restricted to ADMIN only.
 */
router.post('/', requireRole('ADMIN'), createSubscriptionPlan);

/**
 * PUT /api/subscription-plans/:id
 * Update an existing subscription plan.
 * Restricted to ADMIN only.
 */
router.put('/:id', requireRole('ADMIN'), updateSubscriptionPlan);

/**
 * PATCH /api/subscription-plans/:id/status
 * Activate or deactivate a subscription plan.
 * Restricted to ADMIN only.
 */
router.patch('/:id/status', requireRole('ADMIN'), updateSubscriptionPlanStatus);

export default router;

