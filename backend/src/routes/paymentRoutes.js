import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import {
  recordPayment,
  listPayments,
  getPaymentById,
  getInvoicePayments,
  getCustomerPayments
} from '../controllers/paymentController.js';

const router = Router();

router.use(verifyAuth);

// Record a Payment against an Invoice (Staff & Admin)
router.post('/', requireRoles(['ADMIN', 'STAFF']), recordPayment);

// List Payments (Admin, Staff, and Customers for own payments)
router.get('/', requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), listPayments);

// Get specific payment details
router.get('/:id', requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), getPaymentById);

// Get payments for specific invoice
router.get('/invoice/:invoiceId', requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), getInvoicePayments);

// Get payments for specific customer
router.get('/customer/:customerId', requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), getCustomerPayments);

export default router;
