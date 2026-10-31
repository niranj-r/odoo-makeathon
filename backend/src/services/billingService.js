import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { calculateBillingPeriod, formatDateOnly } from '../utils/billingCalculator.js';
import { sendInvoiceEmail } from './emailService.js';

/**
 * Finds all active subscriptions that are currently due for billing.
 */
export const findSubscriptionsDueForBilling = async (referenceDateInput = new Date()) => {
  const refDate = formatDateOnly(referenceDateInput);

  if (!isSupabaseConfigured() || !supabaseAdmin) {
    // Return empty array if unconfigured
    return [];
  }

  // Find ACTIVE subscriptions where next_billing_date <= refDate or next_billing_date is NULL
  const { data: subscriptions, error } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      id,
      subscription_number,
      customer_id,
      plan_name_snapshot,
      billing_frequency,
      start_date,
      end_date,
      status,
      subtotal,
      tax_amount,
      grand_total,
      payment_terms,
      next_billing_date,
      last_billed_date,
      customers (
        id,
        name,
        email,
        company_name,
        billing_address,
        tax_id
      ),
      subscription_lines (
        id,
        product_id,
        product_name_snapshot,
        quantity,
        unit_price,
        tax_id,
        tax_percentage_snapshot,
        line_subtotal,
        tax_amount,
        final_amount
      )
    `)
    .in('status', ['ACTIVE', 'CONFIRMED'])
    .or(`next_billing_date.lte.${refDate},next_billing_date.is.null`);

  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return [];
    }
    throw new Error(`Failed to query due subscriptions: ${error.message}`);
  }

  // Filter out any where end_date < refDate (expired contracts)
  const dueList = (subscriptions || []).filter((sub) => {
    if (sub.end_date && sub.end_date < refDate) {
      return false;
    }
    return true;
  });

  return dueList;
};

/**
 * Generates an invoice for a single subscription for its current billing cycle.
 * Incorporates strict duplicate billing prevention.
 */
export const generateInvoiceForSubscription = async (
  subscriptionId,
  options = { referenceDate: new Date(), createdBy: null, sendEmail: true }
) => {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Fetch Subscription details
  const { data: sub, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select(`
      *,
      customers (*),
      subscription_lines (*)
    `)
    .eq('id', subscriptionId)
    .single();

  if (subError || !sub) {
    throw new Error(`Subscription not found: ${subError?.message || subscriptionId}`);
  }

  if (sub.status !== 'ACTIVE' && sub.status !== 'CONFIRMED') {
    throw new Error(`Subscription ${sub.subscription_number} is not active (current status: ${sub.status}).`);
  }

  // 2. Compute Billing Period
  // Start from next_billing_date if already tracked, otherwise start_date
  const cycleStart = sub.next_billing_date || sub.start_date || formatDateOnly(options.referenceDate);
  const { periodStart, periodEnd, nextBillingDate } = calculateBillingPeriod(
    sub.billing_frequency,
    cycleStart
  );

  // 3. DUPLICATE PREVENTION: Check if invoice already exists for this exact period
  const { data: existingInvoices, error: checkError } = await supabaseAdmin
    .from('invoices')
    .select('id, invoice_number, status, grand_total, billing_period_start, billing_period_end')
    .eq('subscription_id', subscriptionId)
    .eq('billing_period_start', periodStart)
    .eq('billing_period_end', periodEnd)
    .neq('status', 'CANCELLED');

  if (checkError) {
    throw new Error(`Error checking duplicate invoice: ${checkError.message}`);
  }

  if (existingInvoices && existingInvoices.length > 0) {
    const existing = existingInvoices[0];
    return {
      success: false,
      isDuplicate: true,
      message: `Invoice ${existing.invoice_number} already generated for period ${periodStart} to ${periodEnd}.`,
      invoice: existing
    };
  }

  // 4. Calculate Due Date (default: 15 days from today)
  const today = formatDateOnly(options.referenceDate || new Date());
  const dueDateObj = new Date(today);
  dueDateObj.setDate(dueDateObj.getDate() + 15);
  const dueDate = formatDateOnly(dueDateObj);

  // 5. Insert Invoice Header
  const invoiceData = {
    subscription_id: sub.id,
    customer_id: sub.customer_id,
    invoice_date: today,
    due_date: dueDate,
    billing_period_start: periodStart,
    billing_period_end: periodEnd,
    status: 'CONFIRMED',
    payment_status: 'UNPAID',
    subtotal: sub.subtotal || 0,
    discount_amount: 0.00,
    tax_amount: sub.tax_amount || 0,
    grand_total: sub.grand_total || 0,
    amount_paid: 0.00,
    outstanding_amount: sub.grand_total || 0,
    payment_terms: sub.payment_terms || 'Due on receipt',
    notes: `Recurring billing for Subscription ${sub.subscription_number} (${sub.billing_frequency})`,
    confirmed_at: new Date().toISOString(),
    created_by: options.createdBy || null
  };

  const { data: newInvoice, error: invError } = await supabaseAdmin
    .from('invoices')
    .insert(invoiceData)
    .select()
    .single();

  if (invError || !newInvoice) {
    throw new Error(`Failed to create invoice record: ${invError?.message}`);
  }

  // 6. Copy Line Items from Subscription Lines
  const invoiceLinesToInsert = (sub.subscription_lines || []).map((line) => ({
    invoice_id: newInvoice.id,
    product_id: line.product_id,
    product_name_snapshot: line.product_name_snapshot || 'Product Item',
    quantity: line.quantity || 1,
    unit_price: line.unit_price || 0,
    tax_id: line.tax_id,
    tax_percentage_snapshot: line.tax_percentage_snapshot || 0,
    line_subtotal: line.line_subtotal || 0,
    line_tax: line.tax_amount || 0,
    line_total: line.final_amount || line.line_subtotal || 0
  }));

  let insertedLines = [];
  if (invoiceLinesToInsert.length > 0) {
    const { data: linesData, error: linesError } = await supabaseAdmin
      .from('invoice_lines')
      .insert(invoiceLinesToInsert)
      .select();

    if (linesError) {
      console.error('Failed to insert invoice lines:', linesError);
    } else {
      insertedLines = linesData;
    }
  }

  // 7. Advance Subscription next_billing_date & last_billed_date
  await supabaseAdmin
    .from('subscriptions')
    .update({
      last_billed_date: periodEnd,
      next_billing_date: nextBillingDate,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscriptionId);

  // 8. Optionally Send Notification Email
  if (options.sendEmail && sub.customers?.email) {
    try {
      await sendInvoiceEmail(newInvoice, sub.customers, insertedLines);
    } catch (emailErr) {
      console.warn('Could not send invoice notification email:', emailErr.message);
    }
  }

  return {
    success: true,
    isDuplicate: false,
    message: `Invoice ${newInvoice.invoice_number} successfully generated.`,
    invoice: newInvoice,
    lines: insertedLines
  };
};

/**
 * Runs a complete billing batch run for all due subscriptions.
 */
export const runBillingRun = async (referenceDateInput = new Date(), createdBy = null) => {
  const refDate = formatDateOnly(referenceDateInput);
  const dueSubs = await findSubscriptionsDueForBilling(refDate);

  const results = {
    runDate: refDate,
    totalDue: dueSubs.length,
    generatedCount: 0,
    skippedDuplicateCount: 0,
    errorCount: 0,
    generatedInvoices: [],
    skipped: [],
    errors: []
  };

  for (const sub of dueSubs) {
    try {
      const outcome = await generateInvoiceForSubscription(sub.id, {
        referenceDate: refDate,
        createdBy,
        sendEmail: true
      });

      if (outcome.isDuplicate) {
        results.skippedDuplicateCount++;
        results.skipped.push({
          subscriptionId: sub.id,
          subscriptionNumber: sub.subscription_number,
          reason: outcome.message
        });
      } else {
        results.generatedCount++;
        results.generatedInvoices.push({
          subscriptionNumber: sub.subscription_number,
          invoiceNumber: outcome.invoice.invoice_number,
          amount: outcome.invoice.grand_total,
          customer: sub.customers?.name
        });
      }
    } catch (err) {
      results.errorCount++;
      results.errors.push({
        subscriptionId: sub.id,
        subscriptionNumber: sub.subscription_number,
        error: err.message
      });
    }
  }

  return results;
};

