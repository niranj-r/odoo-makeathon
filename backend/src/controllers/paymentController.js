import {
  recordPayment as recordPaymentService,
  listPayments as listPaymentsService,
  getPaymentById as getPaymentByIdService
} from '../services/paymentService.js';
import { isValidUUID } from '../utils/validators.js';

/**
 * POST /api/payments
 * Records a payment against an invoice and recalculates invoice balance and status.
 */
export const recordPayment = async (req, res, next) => {
  try {
    const outcome = await recordPaymentService(req.body, req.user);
    return res.status(201).json(outcome);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments
 * Lists payment transactions with filtering and pagination.
 */
export const listPayments = async (req, res, next) => {
  try {
    const result = await listPaymentsService(
      req.query,
      req.user?.role || 'STAFF',
      req.user?.id || null
    );

    return res.json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/:id
 * Retrieves payment details.
 */
export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID format.' });
    }

    const payment = await getPaymentByIdService(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Role check: customer can only view own payment
    if (req.user?.role === 'CUSTOMER') {
      const customerRecord = payment.customers;
      if (customerRecord?.profile_id && customerRecord.profile_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized.' });
      }
    }

    return res.json({
      success: true,
      data: payment
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/invoice/:invoiceId
 * Lists all payments allocated to a specific invoice.
 */
export const getInvoicePayments = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    if (!isValidUUID(invoiceId)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID format.' });
    }

    const result = await listPaymentsService(
      { invoice_id: invoiceId, limit: 100 },
      req.user?.role || 'STAFF',
      req.user?.id || null
    );

    return res.json({
      success: true,
      data: result.data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/customer/:customerId
 * Lists all payments recorded for a specific customer.
 */
export const getCustomerPayments = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    if (!isValidUUID(customerId)) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID format.' });
    }

    const result = await listPaymentsService(
      { customer_id: customerId, limit: 100 },
      req.user?.role || 'STAFF',
      req.user?.id || null
    );

    return res.json({
      success: true,
      data: result.data
    });
  } catch (err) {
    next(err);
  }
};
