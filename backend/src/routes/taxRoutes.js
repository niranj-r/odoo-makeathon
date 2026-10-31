import express from 'express';
import {
  listTaxes,
  getTaxById,
  createTax,
  updateTax,
  updateTaxStatus,
  getProductTaxes,
  assignProductTaxes
} from '../controllers/taxController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole, requireRoles } from '../middleware/roles.js';

const router = express.Router();

/**
 * All tax endpoints require authentication
 */
router.use(verifyAuth);

/**
 * GET /api/taxes
 * List all taxes with filtering by name, computation_type, and status.
 * Accessible by ADMIN and STAFF (and active taxes by CUSTOMER).
 */
router.get('/', requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), listTaxes);

/**
 * GET /api/taxes/:id
 * Retrieve details for a single tax.
 * Accessible by ADMIN and STAFF (and active taxes by CUSTOMER).
 */
router.get('/:id', requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), getTaxById);

/**
 * POST /api/taxes
 * Create a new tax (percentage or fixed).
 * Restricted to ADMIN only.
 */
router.post('/', requireRole('ADMIN'), createTax);

/**
 * PUT /api/taxes/:id
 * Update an existing tax.
 * Restricted to ADMIN only.
 */
router.put('/:id', requireRole('ADMIN'), updateTax);

/**
 * PATCH /api/taxes/:id/status
 * Activate or deactivate a tax.
 * Restricted to ADMIN only.
 */
router.patch('/:id/status', requireRole('ADMIN'), updateTaxStatus);

export default router;

