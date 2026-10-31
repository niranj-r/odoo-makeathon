import { Router } from 'express';
import {
  listDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  updateDiscountStatus,
  validateDiscountCode
} from '../controllers/discountController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole, requireRoles } from '../middleware/roles.js';

const router = Router();

// Middleware for routes that can accept either authenticated users or guests
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return verifyAuth(req, res, next);
  }
  next();
};

/**
 * Public / Authenticated endpoints
 */
// Validate discount code for quotation or checkout computation (does NOT increment usage)
router.post('/validate', optionalAuth, validateDiscountCode);

/**
 * Authenticated endpoints
 */
// GET /api/discounts - List discounts (ADMIN, STAFF, CUSTOMER)
router.get('/', verifyAuth, requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), listDiscounts);

// GET /api/discounts/:id - Single discount details (ADMIN, STAFF)
router.get('/:id', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getDiscountById);

// POST /api/discounts - Create new discount (ADMIN only)
router.post('/', verifyAuth, requireRole('ADMIN'), createDiscount);

// PUT /api/discounts/:id - Update discount (ADMIN only)
router.put('/:id', verifyAuth, requireRole('ADMIN'), updateDiscount);

// PATCH /api/discounts/:id/status - Activate / deactivate discount (ADMIN only)
router.patch('/:id/status', verifyAuth, requireRole('ADMIN'), updateDiscountStatus);

export default router;

