import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import {
  createQuotation,
  listQuotations,
  getQuotation,
  updateQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation
} from '../controllers/quotationController.js';

const router = Router();

// Staff & Admin Quotation Operations
router.post('/quotations', verifyAuth, requireRoles(['ADMIN', 'STAFF']), createQuotation);
router.get('/quotations', verifyAuth, requireRoles(['ADMIN', 'STAFF']), listQuotations);
router.get('/quotations/:id', verifyAuth, requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), getQuotation);
router.put('/quotations/:id', verifyAuth, requireRoles(['ADMIN', 'STAFF']), updateQuotation);

// Status Transition Endpoints
router.post('/quotations/:id/send', verifyAuth, requireRoles(['ADMIN', 'STAFF']), sendQuotation);
router.post('/quotations/:id/accept', verifyAuth, requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), acceptQuotation);
router.post('/quotations/:id/reject', verifyAuth, requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), rejectQuotation);

export default router;

