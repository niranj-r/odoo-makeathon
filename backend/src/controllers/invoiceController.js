import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import {
  calculateInvoiceTotals,
  formatDateOnly,
  roundToTwo
} from '../utils/billingCalculator.js';
import { generateInvoiceForSubscription } from '../services/billingService.js';
import { generateInvoicePdfBuffer } from '../services/pdfService.js';
import { sendInvoiceEmail } from '../services/emailService.js';
import { isValidUUID, parsePagination } from '../utils/validators.js';

/**
 * GET /api/invoices
 * Lists invoices with search, filtering, and summary financial metrics.
 */
export const listInvoices = async (req, res, next) => {
  try {
    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        summary: { totalInvoiced: 0, totalCollected: 0, totalOutstanding: 0, overdueCount: 0 }
      });
    }

    const { page, limit, offset } = parsePagination(req.query);
    const { status, payment_status, customer_id, subscription_id, search, start_date, end_date } = req.query;

    let query = supabaseAdmin
      .from('invoices')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          company_name
        ),
        subscriptions (
          id,
          subscription_number,
          billing_frequency
        )
      `, { count: 'exact' });

    // Customer role scoping
    if (req.user?.role === 'CUSTOMER') {
      const { data: custRecord } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('profile_id', req.user.id)
        .single();

      if (!custRecord) {
        return res.json({
          success: true,
          data: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
          summary: { totalInvoiced: 0, totalCollected: 0, totalOutstanding: 0, overdueCount: 0 }
        });
      }
      query = query.eq('customer_id', custRecord.id);
    } else if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    if (subscription_id) query = query.eq('subscription_id', subscription_id);
    if (status) query = query.eq('status', status.toUpperCase());
    if (payment_status) query = query.eq('payment_status', payment_status.toUpperCase());
    if (start_date) query = query.gte('invoice_date', start_date);
    if (end_date) query = query.lte('invoice_date', end_date);
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,payment_terms.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    query = query.order('invoice_date', { ascending: false }).order('created_at', { ascending: false });
    query = query.range(offset, offset + limit - 1);

    const { data: invoices, count, error } = await query;
    if (error) throw error;

    // Financial Metrics Calculation
    let totalInvoiced = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    const today = formatDateOnly(new Date());

    (invoices || []).forEach((inv) => {
      if (inv.status !== 'CANCELLED') {
        totalInvoiced += Number(inv.grand_total || 0);
        totalCollected += Number(inv.amount_paid || 0);
        totalOutstanding += Number(inv.outstanding_amount || 0);

        if (inv.due_date < today && inv.payment_status !== 'PAID') {
          overdueCount++;
        }
      }
    });

    return res.json({
      success: true,
      data: invoices || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      },
      summary: {
        totalInvoiced: roundToTwo(totalInvoiced),
        totalCollected: roundToTwo(totalCollected),
        totalOutstanding: roundToTwo(totalOutstanding),
        overdueCount
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/invoices/:id
 * Retrieves full invoice details with lines, payments, and relations.
 */
export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID format.' });
    }

    if (!isSupabaseConfigured() || !supabaseAdmin) {
      return res.status(503).json({ success: false, message: 'Database service unconfigured.' });
    }

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        customers (*),
        subscriptions (*),
        invoice_lines (*),
        payments (*)
      `)
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Role check: customer can only view their own
    if (req.user?.role === 'CUSTOMER') {
      const { data: custRecord } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('profile_id', req.user.id)
        .single();

      if (!custRecord || custRecord.id !== invoice.customer_id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this invoice.' });
      }
    }

    return res.json({
      success: true,
      data: invoice
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/invoices
 * Manually creates a new invoice with lines (Staff/Admin).
 */
export const createInvoice = async (req, res, next) => {
  try {
    const {
      customer_id,
      subscription_id = null,
      invoice_date = formatDateOnly(new Date()),
      due_date,
      billing_period_start = null,
      billing_period_end = null,
      payment_terms = 'Due on receipt',
      discount_amount = 0,
      notes = null,
      lines = []
    } = req.body;

    if (!customer_id || !isValidUUID(customer_id)) {
      return res.status(400).json({ success: false, message: 'Valid customer_id is required.' });
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, message: 'Invoice must contain at least one line item.' });
    }

    // Calculate totals
    const calculated = calculateInvoiceTotals(lines, discount_amount);

    // Compute due date (default 15 days if omitted)
    let calculatedDueDate = due_date;
    if (!calculatedDueDate) {
      const d = new Date(invoice_date);
      d.setDate(d.getDate() + 15);
      calculatedDueDate = formatDateOnly(d);
    }

    const invoicePayload = {
      customer_id,
      subscription_id,
      invoice_date: formatDateOnly(invoice_date),
      due_date: formatDateOnly(calculatedDueDate),
      billing_period_start: billing_period_start ? formatDateOnly(billing_period_start) : null,
      billing_period_end: billing_period_end ? formatDateOnly(billing_period_end) : null,
      status: 'DRAFT',
      payment_status: 'UNPAID',
      subtotal: calculated.subtotal,
      discount_amount: calculated.discountAmount,
      tax_amount: calculated.taxAmount,
      grand_total: calculated.grandTotal,
      amount_paid: 0.00,
      outstanding_amount: calculated.grandTotal,
      payment_terms,
      notes,
      created_by: req.user?.id || null
    };

    const { data: newInvoice, error: invError } = await supabaseAdmin
      .from('invoices')
      .insert(invoicePayload)
      .select()
      .single();

    if (invError || !newInvoice) {
      throw invError || new Error('Failed to create invoice header.');
    }

    // Insert Line items
    const linesToInsert = calculated.lines.map((l) => ({
      invoice_id: newInvoice.id,
      product_id: l.product_id || null,
      product_name_snapshot: l.product_name_snapshot || l.product_name || 'Product',
      quantity: l.quantity,
      unit_price: l.unit_price,
      tax_id: l.tax_id || null,
      tax_percentage_snapshot: l.tax_percentage_snapshot || 0,
      line_subtotal: l.line_subtotal,
      line_tax: l.line_tax,
      line_total: l.line_total
    }));

    const { data: insertedLines, error: linesErr } = await supabaseAdmin
      .from('invoice_lines')
      .insert(linesToInsert)
      .select();

    if (linesErr) {
      console.error('Error creating invoice lines:', linesErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Invoice created successfully in DRAFT state.',
      data: {
        ...newInvoice,
        lines: insertedLines || []
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/invoices/generate-from-subscription/:subscriptionId
 * Generates an invoice for an active subscription with duplicate check.
 */
export const generateFromSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    if (!isValidUUID(subscriptionId)) {
      return res.status(400).json({ success: false, message: 'Invalid subscription ID.' });
    }

    const outcome = await generateInvoiceForSubscription(subscriptionId, {
      referenceDate: req.body?.referenceDate || new Date(),
      createdBy: req.user?.id || null,
      sendEmail: req.body?.sendEmail ?? true
    });

    if (outcome.isDuplicate) {
      return res.status(409).json({
        success: false,
        isDuplicate: true,
        message: outcome.message,
        data: outcome.invoice
      });
    }

    return res.status(201).json({
      success: true,
      message: outcome.message,
      data: outcome.invoice,
      lines: outcome.lines
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/invoices/:id/confirm
 * Transitions invoice from DRAFT to CONFIRMED.
 */
export const confirmInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID.' });
    }

    const { data: invoice, error: fetchErr } = await supabaseAdmin
      .from('invoices')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchErr || !invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (invoice.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm invoice with current status "${invoice.status}". Only DRAFT invoices can be confirmed.`
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'CONFIRMED',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Invoice confirmed successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/invoices/:id/cancel
 * Cancels an invoice (DRAFT or CONFIRMED). Rejects if payments have been made.
 */
export const cancelInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID.' });
    }

    const { data: invoice, error: fetchErr } = await supabaseAdmin
      .from('invoices')
      .select('status, amount_paid')
      .eq('id', id)
      .single();

    if (fetchErr || !invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    if (Number(invoice.amount_paid) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an invoice with recorded payments. Please refund or reallocate payments first.'
      });
    }

    if (invoice.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Invoice is already cancelled.' });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('invoices')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({
      success: true,
      message: 'Invoice cancelled successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/invoices/:id/send
 * Dispatches an invoice notification email to the customer.
 */
export const sendInvoiceAction = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID.' });
    }

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        customers (*),
        invoice_lines (*)
      `)
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const emailResult = await sendInvoiceEmail(invoice, invoice.customers, invoice.invoice_lines);

    // Update sent_at timestamp
    await supabaseAdmin
      .from('invoices')
      .update({
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    return res.json({
      success: true,
      message: `Invoice email successfully dispatched to ${invoice.customers?.email || 'customer'}.`,
      data: emailResult
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/invoices/:id/pdf
 * Generates and streams PDF invoice for download.
 */
export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid invoice ID.' });
    }

    const { data: invoice, error } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        customers (*),
        invoice_lines (*),
        payments (*)
      `)
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    // Role check: customer can only download own invoice
    if (req.user?.role === 'CUSTOMER') {
      const { data: custRecord } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('profile_id', req.user.id)
        .single();

      if (!custRecord || custRecord.id !== invoice.customer_id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to download this invoice.' });
      }
    }

    const pdfBuffer = await generateInvoicePdfBuffer(
      invoice,
      invoice.invoice_lines || [],
      invoice.customers || {},
      invoice.payments || []
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Invoice-${invoice.invoice_number || id}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

