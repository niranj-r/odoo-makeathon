import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  updateCustomerStatus
} from '../controllers/customerController.js';

const router = Router();

// Staff and Admin Customer Operations (Supports both mount styles)
router.post(['/', '/customers'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), createCustomer);
router.get(['/', '/customers'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), listCustomers);
router.get(['/:id', '/customers/:id'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), getCustomer);
router.put(['/:id', '/customers/:id'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), updateCustomer);
router.patch(['/:id/status', '/customers/:id/status'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), updateCustomerStatus);

export default router;
