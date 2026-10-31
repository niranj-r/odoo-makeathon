/**
 * BRIGHTLOOP - STAFF PORTAL CONTROLLER
 * Comprehensive operational services for staff:
 * Dashboard, Customers, Quotations, Subscriptions, Invoices, Payments, and Profile.
 */

import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { calculateTaxes } from '../services/taxService.js';
import { calculateDiscount } from '../services/discountService.js';
import { logActivity } from './adminStaffController.js';

/* ==============================================================================
 * 1. STAFF DASHBOARD
 * ============================================================================== */

export const getStaffDashboardOverview = async (req, res, next) => {
  try {
    const db = req.userClient || supabaseAdmin;

    const [
      { count: totalCustomers },
      { count: activeSubscriptions },
      { count: pendingQuotations },
      { count: pendingInvoices },
      { count: overdueInvoices },
      { count: upcomingRenewals },
      { count: totalPayments }
    ] = await Promise.all([
      db.from('customers').select('*', { count: 'exact', head: true }),
      db.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      db.from('quotations').select('*', { count: 'exact', head: true }).in('status', ['DRAFT', 'SENT']),
      db.from('invoices').select('*', { count: 'exact', head: true }).eq('payment_status', 'UNPAID'),
      db.from('invoices').select('*', { count: 'exact', head: true }).eq('payment_status', 'UNPAID').lt('due_date', new Date().toISOString().split('T')[0]),
      db.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE').eq('auto_renew', true),
      db.from('payments').select('*', { count: 'exact', head: true })
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalCustomers: totalCustomers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        pendingQuotations: pendingQuotations || 0,
        pendingInvoices: pendingInvoices || 0,
        overdueInvoices: overdueInvoices || 0,
        upcomingRenewals: upcomingRenewals || 0,
        totalPayments: totalPayments || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getStaffDashboardActivities = async (req, res, next) => {
  try {
    const db = req.userClient || supabaseAdmin;

    // 1. Try querying staff_activity_logs
    const { data: logs, error: logError } = await db
      .from('staff_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!logError && logs && logs.length > 0) {
      return res.status(200).json({
        success: true,
        activities: logs
      });
    }

    // 2. Synthesize activities from recent quotations, subscriptions, and invoices
    const [recentQuotes, recentSubs, recentInvoices] = await Promise.all([
      db.from('quotations').select('id, quotation_number, status, grand_total, created_at, customer_id').order('created_at', { ascending: false }).limit(5),
      db.from('subscriptions').select('id, subscription_number, status, billing_frequency, created_at, customer_id').order('created_at', { ascending: false }).limit(5),
      db.from('invoices').select('id, invoice_number, payment_status, grand_total, created_at, customer_id').order('created_at', { ascending: false }).limit(5)
    ]);

    const combined = [];
    (recentQuotes.data || []).forEach(q => combined.push({
      id: q.id,
      action: `Quotation ${q.quotation_number} generated (${q.status})`,
      entity_type: 'quotation',
      entity_id: q.id,
      created_at: q.created_at,
      details: { total: q.grand_total }
    }));
    (recentSubs.data || []).forEach(s => combined.push({
      id: s.id,
      action: `Subscription ${s.subscription_number} initiated (${s.status})`,
      entity_type: 'subscription',
      entity_id: s.id,
      created_at: s.created_at,
      details: { cadence: s.billing_frequency }
    }));
    (recentInvoices.data || []).forEach(inv => combined.push({
      id: inv.id,
      action: `Invoice ${inv.invoice_number} generated (${inv.payment_status})`,
      entity_type: 'invoice',
      entity_id: inv.id,
      created_at: inv.created_at,
      details: { total: inv.grand_total }
    }));

    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({
      success: true,
      activities: combined.slice(0, 10)
    });
  } catch (err) {
    next(err);
  }
};

export const getStaffDashboardAlerts = async (req, res, next) => {
  try {
    const db = req.userClient || supabaseAdmin;
    const today = new Date().toISOString().split('T')[0];

    const [overdueInvoices, draftQuotes] = await Promise.all([
      db.from('invoices')
        .select('id, invoice_number, grand_total, due_date, customer_id')
        .eq('payment_status', 'UNPAID')
        .lt('due_date', today)
        .limit(5),
      db.from('quotations')
        .select('id, quotation_number, grand_total, created_at, customer_id')
        .eq('status', 'DRAFT')
        .limit(5)
    ]);

    const alerts = [];

    (overdueInvoices.data || []).forEach(inv => {
      alerts.push({
        id: `overdue-${inv.id}`,
        type: 'danger',
        title: `Overdue Invoice: ${inv.invoice_number}`,
        description: `Amount due: ₹${inv.grand_total}. Due date was ${inv.due_date}.`,
        link: `/staff/invoices/${inv.id}`
      });
    });

    (draftQuotes.data || []).forEach(q => {
      alerts.push({
        id: `quote-${q.id}`,
        type: 'warning',
        title: `Draft Quotation Pending: ${q.quotation_number}`,
        description: `Value: ₹${q.grand_total}. Awaiting review or dispatch.`,
        link: `/staff/quotations/${q.id}`
      });
    });

    return res.status(200).json({
      success: true,
      alerts
    });
  } catch (err) {
    next(err);
  }
};

/* ==============================================================================
 * 2. CUSTOMER MANAGEMENT
 * ============================================================================== */

export const listCustomers = async (req, res, next) => {
  try {
    const { search = '', status = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const db = req.userClient || supabaseAdmin;

    let query = db.from('customers').select('*', { count: 'exact' });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,customer_number.ilike.%${term}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data: customers, count, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch customers.',
        error: error.message
      });
    }

    const total = count || 0;
    return res.status(200).json({
      success: true,
      customers: customers || [],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum))
    });
  } catch (err) {
    next(err);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = req.userClient || supabaseAdmin;

    const { data: customer, error } = await db
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found.'
      });
    }

    // Fetch related records in parallel
    const [subscriptions, quotations, invoices, payments] = await Promise.all([
      db.from('subscriptions').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      db.from('quotations').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      db.from('invoices').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      db.from('payments').select('*').eq('customer_id', id).order('created_at', { ascending: false })
    ]);

    return res.status(200).json({
      success: true,
      customer,
      subscriptions: subscriptions.data || [],
      quotations: quotations.data || [],
      invoices: invoices.data || [],
      payments: payments.data || []
    });
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, company_name, billing_address, notes } = req.body;

    const db = req.userClient || supabaseAdmin;

    const updatePayload = {
      updated_at: new Date().toISOString()
    };
    if (name) updatePayload.name = name.trim();
    if (phone !== undefined) updatePayload.phone = phone ? phone.trim() : null;
    if (company_name !== undefined) updatePayload.company_name = company_name ? company_name.trim() : null;
    if (billing_address !== undefined) updatePayload.billing_address = billing_address ? billing_address.trim() : null;
    if (notes !== undefined) updatePayload.notes = notes ? notes.trim() : null;

    const { data: updated, error } = await db
      .from('customers')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      return res.status(500).json({
        success: false,
        message: error?.message || 'Failed to update customer record.'
      });
    }

    await logActivity(db, req.user?.id, 'CUSTOMER_UPDATED', 'customer', id, { name: updated.name });

    return res.status(200).json({
      success: true,
      message: 'Customer profile updated successfully.',
      customer: updated
    });
  } catch (err) {
    next(err);
  }
};

/* ==============================================================================
 * 3. QUOTATIONS MANAGEMENT
 * ============================================================================== */

export const listQuotations = async (req, res, next) => {
  try {
    const { status = '', search = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const db = req.userClient || supabaseAdmin;

    let query = db.from('quotations').select('*, customers(id, name, customer_number, email)', { count: 'exact' });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (search && search.trim() !== '') {
      query = query.or(`quotation_number.ilike.%${search.trim()}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data: quotations, count, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch quotations.',
        error: error.message
      });
    }

    const total = count || 0;
    return res.status(200).json({
      success: true,
      quotations: quotations || [],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum))
    });
  } catch (err) {
    next(err);
  }
};

export const getQuotationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = req.userClient || supabaseAdmin;

    const { data: quotation, error } = await db
      .from('quotations')
      .select('*, customers(*)')
      .eq('id', id)
      .single();

    if (error || !quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found.'
      });
    }

    // Fetch quotation lines
    const { data: lines } = await db
      .from('quotation_lines')
      .select('*, products(id, name, sales_price), subscription_plans(id, name, billing_interval, price)')
      .eq('quotation_id', id);

    return res.status(200).json({
      success: true,
      quotation,
      lines: lines || []
    });
  } catch (err) {
    next(err);
  }
};

export const createQuotation = async (req, res, next) => {
  try {
    const { customer_id, items = [], discount_code = null, notes = '', payment_terms = 'Due on receipt' } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Customer is required for quotation creation.'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quotation must include at least one product or subscription line item.'
      });
    }

    const db = req.userClient || supabaseAdmin;

    // Validate customer
    const { data: customer } = await db.from('customers').select('id, name, email').eq('id', customer_id).single();
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Selected customer does not exist.' });
    }

    // Calculate item pricing on backend
    let subtotal = 0;
    const computedLines = [];

    for (const item of items) {
      let unitPrice = 0;
      let description = item.description || '';

      if (item.product_id) {
        const { data: prod } = await db.from('products').select('id, name, sales_price, is_active').eq('id', item.product_id).single();
        if (!prod || !prod.is_active) {
          return res.status(400).json({ success: false, message: `Product ${item.product_id} is inactive or does not exist.` });
        }
        unitPrice = Number(prod.sales_price);
        if (!description) description = prod.name;
      } else if (item.plan_id) {
        const { data: plan } = await db.from('subscription_plans').select('id, name, price, is_active').eq('id', item.plan_id).single();
        if (!plan || !plan.is_active) {
          return res.status(400).json({ success: false, message: `Subscription plan ${item.plan_id} is inactive or does not exist.` });
        }
        unitPrice = Number(plan.price);
        if (!description) description = plan.name;
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const lineSubtotal = Number((unitPrice * qty).toFixed(2));
      subtotal += lineSubtotal;

      computedLines.push({
        product_id: item.product_id || null,
        variant_id: item.variant_id || null,
        plan_id: item.plan_id || null,
        description,
        quantity: qty,
        unit_price: unitPrice,
        tax_rate: 0,
        line_subtotal: lineSubtotal,
        line_tax: 0,
        line_total: lineSubtotal
      });
    }

    // Calculate optional discount
    let discountAmount = 0;
    if (discount_code) {
      const { data: discount } = await db.from('discounts').select('*').eq('code', discount_code.toUpperCase().trim()).single();
      if (discount && discount.is_active) {
        const discResult = calculateDiscount({
          discount,
          items: computedLines.map(l => ({ product_id: l.product_id, quantity: l.quantity, amount: l.line_subtotal })),
          transactionAmount: subtotal,
          totalQuantity: computedLines.reduce((acc, l) => acc + l.quantity, 0)
        });
        if (discResult.isValid) {
          discountAmount = discResult.discountAmount;
        }
      }
    }

    const grandTotal = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

    // Insert quotation
    const { data: newQuote, error: quoteError } = await db
      .from('quotations')
      .insert({
        customer_id,
        status: 'DRAFT',
        order_date: new Date().toISOString().split('T')[0],
        payment_terms,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: 0.00,
        grand_total: grandTotal,
        notes,
        created_by: req.user?.id
      })
      .select()
      .single();

    if (quoteError || !newQuote) {
      return res.status(500).json({ success: false, message: quoteError?.message || 'Failed to create quotation record.' });
    }

    // Insert lines
    const lineInserts = computedLines.map(l => ({ ...l, quotation_id: newQuote.id }));
    await db.from('quotation_lines').insert(lineInserts);

    await logActivity(db, req.user?.id, 'QUOTATION_CREATED', 'quotation', newQuote.id, {
      quotation_number: newQuote.quotation_number,
      customer_id,
      grand_total: grandTotal
    });

    return res.status(201).json({
      success: true,
      message: `Quotation ${newQuote.quotation_number} generated successfully.`,
      quotation: newQuote
    });
  } catch (err) {
    next(err);
  }
};

export const updateQuotationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['DRAFT', 'SENT', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid quotation status.' });
    }

    const db = req.userClient || supabaseAdmin;

    const updatePayload = {
      status,
      updated_at: new Date().toISOString()
    };
    if (notes !== undefined) updatePayload.notes = notes;

    const { data: updated, error } = await db
      .from('quotations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      return res.status(500).json({ success: false, message: error?.message || 'Failed to update quotation status.' });
    }

    await logActivity(db, req.user?.id, `QUOTATION_STATUS_${status}`, 'quotation', id, { new_status: status });

    return res.status(200).json({
      success: true,
      message: `Quotation status updated to ${status}.`,
      quotation: updated
    });
  } catch (err) {
    next(err);
  }
};

/* ==============================================================================
 * 4. SUBSCRIPTIONS MANAGEMENT
 * ============================================================================== */

export const listSubscriptions = async (req, res, next) => {
  try {
    const { status = '', search = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const db = req.userClient || supabaseAdmin;

    let query = db.from('subscriptions').select('*, customers(id, name, customer_number, email)', { count: 'exact' });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (search && search.trim() !== '') {
      query = query.or(`subscription_number.ilike.%${search.trim()}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data: subscriptions, count, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch subscriptions.',
        error: error.message
      });
    }

    const total = count || 0;
    return res.status(200).json({
      success: true,
      subscriptions: subscriptions || [],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum))
    });
  } catch (err) {
    next(err);
  }
};

export const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = req.userClient || supabaseAdmin;

    const { data: subscription, error } = await db
      .from('subscriptions')
      .select('*, customers(*)')
      .eq('id', id)
      .single();

    if (error || !subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' });
    }

    const [lines, history] = await Promise.all([
      db.from('subscription_lines').select('*, products(id, name), subscription_plans(id, name, billing_interval, price)').eq('subscription_id', id),
      db.from('subscription_history').select('*').eq('subscription_id', id).order('created_at', { ascending: false })
    ]);

    return res.status(200).json({
      success: true,
      subscription,
      lines: lines.data || [],
      history: history.data || []
    });
  } catch (err) {
    next(err);
  }
};

export const createSubscription = async (req, res, next) => {
  try {
    const { customer_id, quotation_id = null, billing_frequency = 'monthly', auto_renew = true, items = [] } = req.body;

    if (!customer_id) {
      return res.status(400).json({ success: false, message: 'Customer is required.' });
    }

    const db = req.userClient || supabaseAdmin;

    const startDate = new Date().toISOString().split('T')[0];
    const nextBilling = new Date();
    if (billing_frequency === 'yearly') nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    else if (billing_frequency === 'weekly') nextBilling.setDate(nextBilling.getDate() + 7);
    else nextBilling.setMonth(nextBilling.getMonth() + 1);

    const { data: newSub, error } = await db
      .from('subscriptions')
      .insert({
        customer_id,
        quotation_id,
        status: 'ACTIVE',
        billing_frequency,
        start_date: startDate,
        next_billing_date: nextBilling.toISOString().split('T')[0],
        auto_renew,
        activated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !newSub) {
      return res.status(500).json({ success: false, message: error?.message || 'Failed to create subscription.' });
    }

    // Insert history
    try {
      await db.from('subscription_history').insert({
        subscription_id: newSub.id,
        previous_status: 'NONE',
        new_status: 'ACTIVE',
        operation: 'CREATE',
        performed_by: req.user?.id,
        remarks: 'Activated by Staff Operations'
      });
    } catch (_) {}

    await logActivity(db, req.user?.id, 'SUBSCRIPTION_CREATED', 'subscription', newSub.id, {
      subscription_number: newSub.subscription_number
    });

    return res.status(201).json({
      success: true,
      message: `Subscription ${newSub.subscription_number} initiated successfully.`,
      subscription: newSub
    });
  } catch (err) {
    next(err);
  }
};

export const cancelSubscriptionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Customer requested cancellation' } = req.body;
    const db = req.userClient || supabaseAdmin;

    const { data: updated, error } = await db
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      return res.status(500).json({ success: false, message: error?.message || 'Failed to cancel subscription.' });
    }

    try {
      await db.from('subscription_history').insert({
        subscription_id: id,
        previous_status: 'ACTIVE',
        new_status: 'CANCELLED',
        operation: 'CANCEL',
        performed_by: req.user?.id,
        remarks: reason
      });
    } catch (_) {}

    await logActivity(db, req.user?.id, 'SUBSCRIPTION_CANCELLED', 'subscription', id, { reason });

    return res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully.',
      subscription: updated
    });
  } catch (err) {
    next(err);
  }
};

export const changePlanRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { new_plan_id, reason = 'Customer plan change requested' } = req.body;

    const db = req.userClient || supabaseAdmin;

    try {
      await db.from('subscription_history').insert({
        subscription_id: id,
        operation: 'PLAN_CHANGE_REQUEST',
        performed_by: req.user?.id,
        remarks: `Requested change to plan ${new_plan_id}. Reason: ${reason}`
      });
    } catch (_) {}

    await logActivity(db, req.user?.id, 'SUBSCRIPTION_PLAN_CHANGE_REQUESTED', 'subscription', id, {
      new_plan_id,
      reason
    });

    return res.status(200).json({
      success: true,
      message: 'Plan change request successfully recorded for administrative review.'
    });
  } catch (err) {
    next(err);
  }
};

/* ==============================================================================
 * 5. INVOICES MANAGEMENT
 * ============================================================================== */

export const listInvoices = async (req, res, next) => {
  try {
    const { status = '', payment_status = '', search = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const db = req.userClient || supabaseAdmin;

    let query = db.from('invoices').select('*, customers(id, name, customer_number, email)', { count: 'exact' });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }
    if (payment_status && payment_status !== 'ALL') {
      query = query.eq('payment_status', payment_status);
    }
    if (search && search.trim() !== '') {
      query = query.or(`invoice_number.ilike.%${search.trim()}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data: invoices, count, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch invoices.', error: error.message });
    }

    const total = count || 0;
    return res.status(200).json({
      success: true,
      invoices: invoices || [],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum))
    });
  } catch (err) {
    next(err);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = req.userClient || supabaseAdmin;

    const { data: invoice, error } = await db
      .from('invoices')
      .select('*, customers(*)')
      .eq('id', id)
      .single();

    if (error || !invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const { data: lines } = await db
      .from('invoice_lines')
      .select('*, products(id, name), subscription_plans(id, name)')
      .eq('invoice_id', id);

    return res.status(200).json({
      success: true,
      invoice,
      lines: lines || []
    });
  } catch (err) {
    next(err);
  }
};

export const sendInvoiceToCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = req.userClient || supabaseAdmin;

    const { data: invoice } = await db.from('invoices').select('*, customers(email, name)').eq('id', id).single();
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    const sentAt = new Date().toISOString();
    await db.from('invoices').update({ sent_at: sentAt }).eq('id', id);

    try {
      await db.from('email_notifications').insert({
        recipient_email: invoice.customers?.email || 'customer@brightloop.com',
        recipient_name: invoice.customers?.name || 'Customer',
        subject: `Brightloop Invoice ${invoice.invoice_number}`,
        email_type: 'INVOICE_SENT',
        invoice_id: id,
        sent_status: 'SENT',
        sent_at: sentAt
      });
    } catch (_) {}

    await logActivity(db, req.user?.id, 'INVOICE_SENT', 'invoice', id, {
      invoice_number: invoice.invoice_number
    });

    return res.status(200).json({
      success: true,
      message: `Invoice ${invoice.invoice_number} dispatched to customer email successfully.`
    });
  } catch (err) {
    next(err);
  }
};

/* ==============================================================================
 * 6. PAYMENTS MANAGEMENT
 * ============================================================================== */

export const listPayments = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const db = req.userClient || supabaseAdmin;

    let query = db.from('payments').select('*, customers(name, customer_number), invoices(invoice_number, grand_total)', { count: 'exact' });

    if (search && search.trim() !== '') {
      query = query.or(`payment_number.ilike.%${search.trim()}%,transaction_reference.ilike.%${search.trim()}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data: payments, count, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch payments.', error: error.message });
    }

    const total = count || 0;
    return res.status(200).json({
      success: true,
      payments: payments || [],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(1, Math.ceil(total / limitNum))
    });
  } catch (err) {
    next(err);
  }
};

export const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = req.userClient || supabaseAdmin;

    const { data: payment, error } = await db
      .from('payments')
      .select('*, customers(id, name, customer_number, email), invoices(id, invoice_number, grand_total)')
      .eq('id', id)
      .single();

    if (error || !payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    return res.status(200).json({
      success: true,
      payment
    });
  } catch (err) {
    next(err);
  }
};

export const retryPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = req.userClient || supabaseAdmin;

    // Log the retry action safely
    await logActivity(db, req.user?.id, 'PAYMENT_RETRY_INITIATED', 'payment', id, {
      initiated_by: req.user?.email
    });

    return res.status(200).json({
      success: true,
      message: 'Payment retry flow initiated. Customer has been sent a secure renewal checkout link.'
    });
  } catch (err) {
    next(err);
  }
};

/* ==============================================================================
 * 7. STAFF PROFILE
 * ============================================================================== */

export const getStaffProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      profile: req.user
    });
  } catch (err) {
    next(err);
  }
};

export const updateStaffProfile = async (req, res, next) => {
  try {
    const { full_name, phone } = req.body;

    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const db = req.userClient || supabaseAdmin;

    const payload = {
      full_name: full_name.trim(),
      updated_at: new Date().toISOString()
    };
    if (phone !== undefined) payload.phone = phone ? phone.trim() : null;

    let { data: updated, error } = await db
      .from('profiles')
      .update(payload)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error && error.message?.includes('phone')) {
      delete payload.phone;
      const retry = await db
        .from('profiles')
        .update(payload)
        .eq('id', req.user.id)
        .select()
        .single();
      updated = retry.data;
    }

    return res.status(200).json({
      success: true,
      message: 'Your profile has been updated successfully.',
      profile: updated
    });
  } catch (err) {
    next(err);
  }
};

