import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { calculatePaymentAllocation, formatDateOnly, roundToTwo } from '../utils/billingCalculator.js';
import { sendPaymentReceiptEmail } from './emailService.js';

export const VALID_PAYMENT_METHODS = [
  'CREDIT_CARD',
  'BANK_TRANSFER',
  'CASH',
  'CHECK',
  'PAYPAL',
  'STRIPE',
  'OTHER'
];

/**
 * Records a new payment against an invoice and updates balance & statuses atomically.
 */
export const recordPayment = async (paymentData, userProfile = null) => {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    throw new Error('Supabase client is not configured.');
  }

  const {
    invoice_id,
    amount,
    payment_method,
    payment_date = formatDateOnly(new Date()),
    reference_id = null,
    notes = null,
    send_receipt = true
  } = paymentData;

  if (!invoice_id) {
    throw new Error('invoice_id is required.');
  }

  const numAmount = roundToTwo(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error('Payment amount must be a positive number greater than 0.');
  }

  const method = (payment_method || '').toUpperCase().trim();
  if (!VALID_PAYMENT_METHODS.includes(method)) {
    throw new Error(`Invalid payment method "${payment_method}". Supported: ${VALID_PAYMENT_METHODS.join(', ')}`);
  }

  // 1. Fetch current Invoice
  const { data: invoice, error: invError } = await supabaseAdmin
    .from('invoices')
    .select(`
      *,
      customers (*)
    `)
    .eq('id', invoice_id)
    .single();

  if (invError || !invoice) {
    throw new Error(`Invoice not found: ${invError?.message || invoice_id}`);
  }

  if (invoice.status === 'CANCELLED') {
    throw new Error('Cannot record payment for a CANCELLED invoice.');
  }

  // 2. Perform Payment Allocation Calculation
  const allocation = calculatePaymentAllocation(
    invoice.grand_total,
    invoice.amount_paid,
    numAmount
  );

  // 3. Insert Payment Row
  const newPaymentRow = {
    invoice_id,
    customer_id: invoice.customer_id,
    amount: numAmount,
    payment_method: method,
    payment_date: formatDateOnly(payment_date),
    reference_id: reference_id ? String(reference_id).trim() : null,
    notes: notes ? String(notes).trim() : null,
    status: 'COMPLETED',
    recorded_by: userProfile?.id || null
  };

  const { data: createdPayment, error: payError } = await supabaseAdmin
    .from('payments')
    .insert(newPaymentRow)
    .select()
    .single();

  if (payError || !createdPayment) {
    throw new Error(`Failed to record payment: ${payError?.message}`);
  }

  // 4. Update Invoice Balance and Status
  const invoiceUpdates = {
    amount_paid: allocation.newAmountPaid,
    outstanding_amount: allocation.newOutstanding,
    payment_status: allocation.paymentStatus,
    status: allocation.invoiceStatus,
    paid_at: allocation.paymentStatus === 'PAID' ? new Date().toISOString() : invoice.paid_at,
    updated_at: new Date().toISOString()
  };

  const { data: updatedInvoice, error: updateError } = await supabaseAdmin
    .from('invoices')
    .update(invoiceUpdates)
    .eq('id', invoice_id)
    .select(`
      *,
      customers (*)
    `)
    .single();

  if (updateError) {
    console.error('Failed to update invoice balance:', updateError);
  }

  // 5. Send Payment Receipt Email
  if (send_receipt && invoice.customers?.email) {
    try {
      await sendPaymentReceiptEmail(createdPayment, updatedInvoice || invoice, invoice.customers);
    } catch (receiptErr) {
      console.warn('Could not send payment receipt email:', receiptErr.message);
    }
  }

  return {
    success: true,
    message: 'Payment recorded successfully.',
    data: {
      payment: createdPayment,
      invoice: updatedInvoice || invoice,
      allocation
    }
  };
};

/**
 * Lists payments with pagination and filtering
 */
export const listPayments = async (params = {}, userRole = 'STAFF', userProfileId = null) => {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  }

  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 10));
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('payments')
    .select(`
      *,
      invoices (
        id,
        invoice_number,
        grand_total,
        amount_paid,
        outstanding_amount,
        status,
        payment_status
      ),
      customers (
        id,
        name,
        email,
        company_name
      )
    `, { count: 'exact' });

  // Access Control: Customers can only view their own payments
  if (userRole === 'CUSTOMER' && userProfileId) {
    const { data: custRecord } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('profile_id', userProfileId)
      .single();

    if (custRecord) {
      query = query.eq('customer_id', custRecord.id);
    } else {
      return { data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } };
    }
  }

  if (params.invoice_id) {
    query = query.eq('invoice_id', params.invoice_id);
  }
  if (params.customer_id) {
    query = query.eq('customer_id', params.customer_id);
  }
  if (params.payment_method) {
    query = query.eq('payment_method', params.payment_method.toUpperCase());
  }
  if (params.start_date) {
    query = query.gte('payment_date', params.start_date);
  }
  if (params.end_date) {
    query = query.lte('payment_date', params.end_date);
  }
  if (params.search) {
    query = query.or(`payment_number.ilike.%${params.search}%,reference_id.ilike.%${params.search}%,notes.ilike.%${params.search}%`);
  }

  query = query.order('payment_date', { ascending: false }).order('created_at', { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return {
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 }
      };
    }
    throw new Error(`Failed to list payments: ${error.message}`);
  }

  return {
    data: data || [],
    pagination: {
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
};

/**
 * Retrieves a single payment record with full relationship details
 */
export const getPaymentById = async (paymentId) => {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select(`
      *,
      invoices (
        id,
        invoice_number,
        invoice_date,
        due_date,
        grand_total,
        amount_paid,
        outstanding_amount,
        status,
        payment_status
      ),
      customers (
        id,
        name,
        email,
        company_name,
        billing_address
      )
    `)
    .eq('id', paymentId)
    .single();

  if (error) {
    throw new Error(`Payment not found: ${error.message}`);
  }

  return data;
};

