import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import {
  listInvoices,
  getInvoiceById,
  createInvoice,
  generateFromSubscription,
  confirmInvoice,
  cancelInvoice,
  sendInvoiceAction,
  downloadInvoicePdf
} from '../controllers/invoiceController.js';

const router = Router();

// All invoice endpoints require verified authentication
router.use(verifyAuth);

// Invoice Listing (Staff, Admin, and Customers for own records)
router.get('/', requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), listInvoices);

// Single Invoice Retrieval
router.get('/:id', requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), getInvoiceById);

// PDF Download
router.get('/:id/pdf', requireRoles(['ADMIN', 'STAFF', 'CUSTOMER']), downloadInvoicePdf);

// Manual Invoice Creation (Staff & Admin)
router.post('/', requireRoles(['ADMIN', 'STAFF']), createInvoice);

// On-demand generation from subscription (Staff & Admin)
router.post('/generate-from-subscription/:subscriptionId', requireRoles(['ADMIN', 'STAFF']), generateFromSubscription);

// Confirm Invoice (Draft -> Confirmed)
router.post('/:id/confirm', requireRoles(['ADMIN', 'STAFF']), confirmInvoice);

// Cancel Invoice
router.post('/:id/cancel', requireRoles(['ADMIN', 'STAFF']), cancelInvoice);

// Dispatch Invoice Email
router.post('/:id/send', requireRoles(['ADMIN', 'STAFF']), sendInvoiceAction);

export default router;

