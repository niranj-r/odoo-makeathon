import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import {
  sanitizeString,
  isValidUUID,
  parsePagination
} from '../utils/validators.js';
import {
  calculateLineItem,
  calculateQuotationTotals,
  roundToTwo
} from '../utils/calculator.js';

/**
 * Subscription Management Controller (Member 2 - Phase 05)
 * Handles quotation-to-subscription atomic conversion, standalone subscription creation,
 * retrieval with line items and history, and status-gated modifications.
 */

const ensureSupabase = (res) => {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    res.status(503).json({
      success: false,
      message: 'Database connection is not configured in backend/.env'
    });
    return false;
  }
  return true;
};

/**
 * Task 5.1 – Create Subscription from Accepted Quotation
 * POST /api/subscriptions/from-quotation/:quotationId
 */
export const convertFromQuotation = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { quotationId } = req.params;
    const { plan_id } = req.body || {};

    if (!isValidUUID(quotationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid quotationId UUID format.'
      });
    }

    // 1. Verify quotation exists
    const { data: quote, error: quoteError } = await supabaseAdmin
      .from('quotations')
      .select('*, customer:customers(id, name, status)')
      .eq('id', quotationId)
      .single();

    if (quoteError || !quote) {
      return res.status(404).json({
        success: false,
        message: `Quotation with ID '${quotationId}' was not found.`
      });
    }

    // 2. Verify quotation belongs to a valid customer in ACTIVE standing
    if (!quote.customer || quote.customer.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Customer is in '${quote.customer?.status || 'UNKNOWN'}' standing. Cannot create subscription for inactive customer.`
      });
    }

    // 3. Verify quotation status is ACCEPTED
    if (quote.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Only ACCEPTED quotations can be converted into subscriptions. Current status: ${quote.status}.`
      });
    }

    // 4. Verify quotation has not expired (VULN-004)
    const today = new Date().toISOString().split('T')[0];
    if (quote.validity_date < today) {
      return res.status(400).json({
        success: false,
        message: `Quotation expired on ${quote.validity_date} and cannot be converted into a subscription.`
      });
    }

    // 5. Prevent duplicate subscription generation (VULN-002)
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, status')
      .eq('source_quotation_id', quotationId)
      .maybeSingle();

    if (existingSub) {
      return res.status(409).json({
        success: false,
        message: `A subscription has already been generated from this quotation (${existingSub.subscription_number}). Duplicate conversion is prevented.`,
        existingSubscription: existingSub
      });
    }

    // 6. Execute atomic conversion via RPC or fallback transactional logic
    const userId = req.user?.id || null;
    let newSubscriptionId = null;

    // Try calling atomic RPC function first
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      'convert_quotation_to_subscription',
      {
        p_quotation_id: quotationId,
        p_user_id: userId,
        p_plan_id: plan_id || null
      }
    );

    if (!rpcError && rpcResult?.subscription_id) {
      newSubscriptionId = rpcResult.subscription_id;
    } else {
      // Fallback: Direct Node.js atomic creation
      let planName = 'Standard Plan';
      let billingFreq = 'monthly';

      if (plan_id && isValidUUID(plan_id)) {
        const { data: plan } = await supabaseAdmin
          .from('subscription_plans')
          .select('name, billing_interval')
          .eq('id', plan_id)
          .single();
        if (plan) {
          planName = plan.name;
          billingFreq = plan.billing_interval || 'monthly';
        }
      }

      // Fetch quotation lines
      const { data: quoteLines } = await supabaseAdmin
        .from('quotation_lines')
        .select('*')
        .eq('quotation_id', quotationId);

      // Insert subscription header
      const { data: sub, error: subInsertError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          customer_id: quote.customer_id,
          source_quotation_id: quote.id,
          plan_id: plan_id || null,
          plan_name_snapshot: planName,
          billing_frequency: billingFreq,
          start_date: today,
          status: 'DRAFT',
          subtotal: quote.subtotal,
          tax_amount: quote.tax_amount,
          grand_total: quote.grand_total,
          payment_terms: quote.payment_terms || 'Due on receipt',
          auto_renew: true
        })
        .select()
        .single();

      if (subInsertError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create subscription record.',
          error: subInsertError.message
        });
      }

      newSubscriptionId = sub.id;

      // Copy line items with snapshots
      if (quoteLines && quoteLines.length > 0) {
        const subLinesPayload = quoteLines.map((ql) => ({
          subscription_id: sub.id,
          product_id: ql.product_id,
          product_name_snapshot: ql.product_name_snapshot,
          quantity: ql.quantity,
          unit_price: ql.unit_price,
          tax_percentage_snapshot: ql.tax_percentage_snapshot,
          line_subtotal: ql.line_subtotal,
          line_tax: ql.line_tax,
          line_total: ql.line_total
        }));

        await supabaseAdmin.from('subscription_lines').insert(subLinesPayload);
      }

      // Record initial history
      await supabaseAdmin.from('subscription_history').insert({
        subscription_id: sub.id,
        previous_status: null,
        new_status: 'DRAFT',
        operation: 'CREATE_FROM_QUOTATION',
        performed_by: userId,
        remarks: `Generated automatically from Quotation ${quote.quotation_number}`
      });
    }

    // Retrieve complete created subscription with lines
    const { data: createdSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        customer:customers (
          id,
          customer_number,
          name,
          email,
          company_name
        ),
        lines:subscription_lines (*)
      `)
      .eq('id', newSubscriptionId)
      .single();

    return res.status(201).json({
      success: true,
      message: `Subscription generated successfully from Quotation ${quote.quotation_number}.`,
      subscription: createdSubscription
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 5.2 & 5.3 – Create Subscription Directly
 * POST /api/subscriptions
 */
export const createSubscription = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const {
      customer_id,
      plan_id,
      plan_name,
      billing_frequency = 'monthly',
      start_date,
      end_date,
      payment_terms = 'Due on receipt',
      auto_renew = true,
      lines
    } = req.body;

    // 1. Customer validation
    if (!customer_id || !isValidUUID(customer_id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid customer_id UUID is required.'
      });
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, name, status')
      .eq('id', customer_id)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID '${customer_id}' was not found.`
      });
    }

    if (customer.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Cannot create subscription for customer in '${customer.status}' status.`
      });
    }

    // 2. Billing frequency validation
    const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validFrequencies.includes(billing_frequency)) {
      return res.status(400).json({
        success: false,
        message: `Invalid billing_frequency. Allowed values: ${validFrequencies.join(', ')}`
      });
    }

    // 3. Lines validation
    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Subscription must contain at least one line item.'
      });
    }

    // 4. Resolve plan name snapshot
    let resolvedPlanName = plan_name || 'Custom Subscription Plan';
    if (plan_id && isValidUUID(plan_id)) {
      const { data: planData } = await supabaseAdmin
        .from('subscription_plans')
        .select('name')
        .eq('id', plan_id)
        .single();
      if (planData) {
        resolvedPlanName = planData.name;
      }
    }

    // 5. Query products and taxes for line computations
    const productIds = lines.map((l) => l.product_id).filter(Boolean);
    const taxIds = lines.map((l) => l.tax_id).filter(Boolean);

    const [productsRes, taxesRes] = await Promise.all([
      supabaseAdmin.from('products').select('id, name, sales_price').in('id', productIds),
      taxIds.length > 0
        ? supabaseAdmin.from('taxes').select('id, name, rate_percentage').in('id', taxIds)
        : Promise.resolve({ data: [] })
    ]);

    const productMap = new Map((productsRes.data || []).map((p) => [p.id, p]));
    const taxMap = new Map((taxesRes.data || []).map((t) => [t.id, t]));

    const calculatedLines = [];
    for (let i = 0; i < lines.length; i++) {
      const item = lines[i];
      const product = productMap.get(item.product_id);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Line ${i + 1}: Product with ID '${item.product_id}' was not found.`
        });
      }

      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const unitPrice = item.unit_price !== undefined && parseFloat(item.unit_price) >= 0
        ? parseFloat(item.unit_price)
        : parseFloat(product.sales_price);

      let taxPercentage = 0;
      if (item.tax_id && taxMap.has(item.tax_id)) {
        taxPercentage = parseFloat(taxMap.get(item.tax_id).rate_percentage) || 0;
      }

      const lineCalc = calculateLineItem(qty, unitPrice, taxPercentage);
      calculatedLines.push({
        product_id: product.id,
        product_name_snapshot: product.name,
        quantity: lineCalc.quantity,
        unit_price: lineCalc.unitPrice,
        tax_percentage_snapshot: lineCalc.taxRate,
        line_subtotal: lineCalc.lineSubtotal,
        line_tax: lineCalc.lineTax,
        line_total: lineCalc.lineTotal
      });
    }

    const totals = calculateQuotationTotals(calculatedLines, 0);

    const startDate = start_date || new Date().toISOString().split('T')[0];

    // 6. Insert subscription
    const { data: newSubscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        customer_id,
        plan_id: plan_id && isValidUUID(plan_id) ? plan_id : null,
        plan_name_snapshot: sanitizeString(resolvedPlanName, 150),
        billing_frequency,
        start_date: startDate,
        end_date: end_date || null,
        status: 'DRAFT',
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        grand_total: totals.grandTotal,
        payment_terms: sanitizeString(payment_terms, 255),
        auto_renew: Boolean(auto_renew)
      })
      .select()
      .single();

    if (subError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create subscription.',
        error: subError.message
      });
    }

    // 7. Insert line items
    const linesPayload = calculatedLines.map((l) => ({
      ...l,
      subscription_id: newSubscription.id
    }));

    const { data: createdLines, error: linesError } = await supabaseAdmin
      .from('subscription_lines')
      .insert(linesPayload)
      .select();

    if (linesError) {
      console.error('Failed to insert subscription lines:', linesError);
    }

    // 8. Record initial lifecycle history
    await supabaseAdmin.from('subscription_history').insert({
      subscription_id: newSubscription.id,
      previous_status: null,
      new_status: 'DRAFT',
      operation: 'CREATE_DIRECT',
      performed_by: req.user?.id || null,
      remarks: 'Created directly via Subscription Management'
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription created successfully as Draft.',
      subscription: {
        ...newSubscription,
        lines: createdLines || []
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 5.4 – Retrieve Subscriptions
 * GET /api/subscriptions
 * Filters: page, limit, sortBy, sortOrder, status, customer_id, plan_id, startDate, endDate, q
 */
export const listSubscriptions = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { page, limit, from, to } = parsePagination(req.query);
    const {
      sortBy = 'created_at',
      sortOrder = 'desc',
      status,
      customer_id,
      plan_id,
      startDate,
      endDate,
      q
    } = req.query;

    const allowedSortFields = ['created_at', 'subscription_number', 'start_date', 'end_date', 'grand_total', 'status'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const isAscending = String(sortOrder).toLowerCase() === 'asc';

    let query = supabaseAdmin
      .from('subscriptions')
      .select(`
        id,
        subscription_number,
        plan_name_snapshot,
        billing_frequency,
        start_date,
        end_date,
        status,
        subtotal,
        tax_amount,
        grand_total,
        payment_terms,
        auto_renew,
        created_at,
        customer:customers (
          id,
          customer_number,
          name,
          email,
          company_name
        )
      `, { count: 'exact' });

    // Status filter
    if (status && ['DRAFT', 'CONFIRMED', 'ACTIVE', 'PAUSED', 'CLOSED', 'CANCELLED'].includes(status.toUpperCase())) {
      query = query.eq('status', status.toUpperCase());
    }

    // Customer filter
    if (customer_id && isValidUUID(customer_id)) {
      query = query.eq('customer_id', customer_id);
    }

    // Plan filter
    if (plan_id && isValidUUID(plan_id)) {
      query = query.eq('plan_id', plan_id);
    }

    // Date filters
    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('end_date', endDate);
    }

    // Search query
    if (q && typeof q === 'string' && q.trim()) {
      const sanitizedQ = q.trim().replace(/[%_]/g, '');
      if (sanitizedQ.length > 0) {
        query = query.or(`subscription_number.ilike.%${sanitizedQ}%,plan_name_snapshot.ilike.%${sanitizedQ}%`);
      }
    }

    query = query
      .order(safeSortBy, { ascending: isAscending })
      .range(from, to);

    const { data: subscriptions, count, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscriptions.',
        error: error.message
      });
    }

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      subscriptions: subscriptions || [],
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 5.5 – Retrieve Individual Subscription
 * GET /api/subscriptions/:id
 */
export const getSubscription = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format. Must be a valid UUID.'
      });
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        customer:customers (
          id,
          customer_number,
          name,
          email,
          phone,
          company_name,
          billing_address,
          tax_id
        ),
        source_quotation:quotations (
          id,
          quotation_number,
          status,
          grand_total
        ),
        plan:subscription_plans (
          id,
          name,
          billing_interval,
          price
        )
      `)
      .eq('id', id)
      .single();

    if (subError || !subscription) {
      return res.status(404).json({
        success: false,
        message: `Subscription with ID '${id}' was not found.`
      });
    }

    // Retrieve subscription lines
    const { data: lines } = await supabaseAdmin
      .from('subscription_lines')
      .select('*')
      .eq('subscription_id', id);

    // Retrieve subscription lifecycle history
    const { data: history } = await supabaseAdmin
      .from('subscription_history')
      .select(`
        id,
        previous_status,
        new_status,
        operation,
        remarks,
        timestamp,
        performer:profiles (
          id,
          full_name,
          email
        )
      `)
      .eq('subscription_id', id)
      .order('timestamp', { ascending: true });

    return res.status(200).json({
      success: true,
      subscription: {
        ...subscription,
        lines: lines || [],
        history: history || []
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 5.6 – Edit Subscription
 * PUT /api/subscriptions/:id
 * Only permitted modifications based on current subscription status.
 */
export const updateSubscription = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format.'
      });
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, status')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found.'
      });
    }

    // Terminal statuses cannot be modified
    if (['CLOSED', 'CANCELLED'].includes(existing.status)) {
      return res.status(400).json({
        success: false,
        message: `Subscription is ${existing.status} and cannot be modified.`
      });
    }

    const {
      payment_terms,
      auto_renew,
      end_date,
      billing_frequency,
      lines
    } = req.body;

    const updatePayload = {
      updated_at: new Date().toISOString()
    };

    if (payment_terms !== undefined) updatePayload.payment_terms = sanitizeString(payment_terms, 255);
    if (auto_renew !== undefined) updatePayload.auto_renew = Boolean(auto_renew);
    if (end_date !== undefined) updatePayload.end_date = end_date || null;

    // Structural edits (billing frequency, line items) are only permitted in DRAFT status
    if (existing.status === 'DRAFT') {
      if (billing_frequency !== undefined) {
        const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
        if (validFrequencies.includes(billing_frequency)) {
          updatePayload.billing_frequency = billing_frequency;
        }
      }

      if (Array.isArray(lines) && lines.length > 0) {
        // Recalculate lines server-side
        const productIds = lines.map((l) => l.product_id).filter(Boolean);
        const { data: products } = await supabaseAdmin.from('products').select('id, name, sales_price').in('id', productIds);
        const productMap = new Map((products || []).map((p) => [p.id, p]));

        const calculatedLines = [];
        for (const item of lines) {
          const product = productMap.get(item.product_id);
          if (product) {
            const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
            const unitPrice = item.unit_price !== undefined ? parseFloat(item.unit_price) : parseFloat(product.sales_price);
            const taxRate = parseFloat(item.tax_percentage || 0);
            const lineCalc = calculateLineItem(qty, unitPrice, taxRate);
            calculatedLines.push({
              subscription_id: id,
              product_id: product.id,
              product_name_snapshot: product.name,
              quantity: lineCalc.quantity,
              unit_price: lineCalc.unitPrice,
              tax_percentage_snapshot: lineCalc.taxRate,
              line_subtotal: lineCalc.lineSubtotal,
              line_tax: lineCalc.lineTax,
              line_total: lineCalc.lineTotal
            });
          }
        }

        if (calculatedLines.length > 0) {
          const totals = calculateQuotationTotals(calculatedLines, 0);
          updatePayload.subtotal = totals.subtotal;
          updatePayload.tax_amount = totals.taxAmount;
          updatePayload.grand_total = totals.grandTotal;

          await supabaseAdmin.from('subscription_lines').delete().eq('subscription_id', id);
          await supabaseAdmin.from('subscription_lines').insert(calculatedLines);
        }
      }
    } else {
      // If subscription is ACTIVE, CONFIRMED, or PAUSED, reject attempts to tamper with line items
      if (Array.isArray(lines) || billing_frequency !== undefined) {
        return res.status(400).json({
          success: false,
          message: `Cannot alter pricing lines or billing frequency on a ${existing.status} subscription. Only non-financial terms (payment terms, auto-renew, end date) can be updated.`
        });
      }
    }

    const { data: updatedSub, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update subscription.',
        error: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subscription updated successfully.',
      subscription: updatedSub
    });
  } catch (err) {
    next(err);
  }
};
