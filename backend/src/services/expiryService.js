import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';

/**
 * Expiry Service (Member 2 - Phase 07)
 * Implements automated expiration and lifecycle background processing for:
 * 1. Quotations past their validity date (Task 7.1)
 * 2. Active subscriptions past their end date without auto-renewal (Task 7.2)
 * 3. Auto-renewal execution for eligible active subscriptions (Task 7.3)
 * 4. Approaching expiry notification detection (Task 7.4)
 *
 * Security & Reliability Mitigations:
 * - VULN-007: In-memory concurrency mutex lock prevents race conditions and overlapping execution
 * - Idempotent update filtering ensures already-processed entities are untouched
 * - Immutable lifecycle audit trail in subscription_history for every automated status change
 */

// Format date as YYYY-MM-DD
export const formatDateOnly = (d = new Date()) => {
  const date = d instanceof Date ? d : new Date(d);
  return date.toISOString().split('T')[0];
};

// Calculate next end date based on billing frequency
export const addFrequencyToDate = (baseDateStr, frequency) => {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  const next = new Date(base);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return formatDateOnly(next);
};

// In-memory execution mutex to prevent overlapping worker runs (VULN-007)
let isJobRunning = false;
let lastRunAt = null;
let lastResult = null;

/**
 * Task 7.1 – Quotation Expiry Automation
 * Identifies DRAFT or SENT quotations whose validity_date < referenceDate
 * Updates status to EXPIRED.
 */
export const expireQuotations = async (referenceDate = new Date()) => {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    throw new Error('Database is not configured.');
  }

  const todayStr = formatDateOnly(referenceDate);

  // 1. Fetch eligible quotations
  const { data: eligibleQuotes, error: fetchError } = await supabaseAdmin
    .from('quotations')
    .select('id, quotation_number, status, validity_date, customer_id')
    .in('status', ['DRAFT', 'SENT'])
    .lt('validity_date', todayStr);

  if (fetchError) {
    throw new Error(`Failed to query expired quotations: ${fetchError.message}`);
  }

  if (!eligibleQuotes || eligibleQuotes.length === 0) {
    return {
      expiredCount: 0,
      quotationIds: [],
      quotations: []
    };
  }

  const quoteIds = eligibleQuotes.map((q) => q.id);

  // 2. Batch update to EXPIRED
  const { error: updateError } = await supabaseAdmin
    .from('quotations')
    .update({
      status: 'EXPIRED',
      updated_at: new Date().toISOString()
    })
    .in('id', quoteIds);

  if (updateError) {
    throw new Error(`Failed to batch update quotations to EXPIRED: ${updateError.message}`);
  }

  return {
    expiredCount: quoteIds.length,
    quotationIds: quoteIds,
    quotations: eligibleQuotes
  };
};

/**
 * Task 7.2 & 7.3 – Subscription Expiry & Auto-Renewal Automation
 * - Closes ACTIVE subscriptions past their end_date where auto_renew = false
 * - Auto-renews ACTIVE subscriptions past their end_date where auto_renew = true
 * - Records immutable audit history for both actions
 */
export const closeExpiredSubscriptions = async (referenceDate = new Date()) => {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    throw new Error('Database is not configured.');
  }

  const todayStr = formatDateOnly(referenceDate);

  // 1. Fetch eligible active subscriptions past end date
  const { data: eligibleSubs, error: fetchError } = await supabaseAdmin
    .from('subscriptions')
    .select('id, subscription_number, status, end_date, billing_frequency, auto_renew, customer_id')
    .eq('status', 'ACTIVE')
    .not('end_date', 'is', null)
    .lt('end_date', todayStr);

  if (fetchError) {
    throw new Error(`Failed to query expired subscriptions: ${fetchError.message}`);
  }

  const closedSubs = [];
  const renewedSubs = [];

  if (!eligibleSubs || eligibleSubs.length === 0) {
    return {
      closedCount: 0,
      autoRenewedCount: 0,
      closedSubscriptions: [],
      renewedSubscriptions: []
    };
  }

  const nowIso = new Date().toISOString();

  // 2. Process each eligible subscription
  for (const sub of eligibleSubs) {
    if (sub.auto_renew === false) {
      // Close the subscription
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'CLOSED',
          closed_at: nowIso,
          updated_at: nowIso
        })
        .eq('id', sub.id)
        .eq('status', 'ACTIVE'); // Optimistic lock guard

      if (!updateError) {
        // Log to subscription_history (VULN-010)
        await supabaseAdmin.from('subscription_history').insert({
          subscription_id: sub.id,
          previous_status: 'ACTIVE',
          new_status: 'CLOSED',
          operation: 'EXPIRE',
          performed_by: null, // System automated job
          remarks: 'Automatic expiry: subscription reached end date without auto-renewal enabled.'
        });

        closedSubs.push(sub);
      }
    } else {
      // Auto-renew the subscription by advancing the end_date
      const nextEndDate = addFrequencyToDate(sub.end_date, sub.billing_frequency);

      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          end_date: nextEndDate,
          resumed_at: nowIso,
          updated_at: nowIso
        })
        .eq('id', sub.id)
        .eq('status', 'ACTIVE');

      if (!updateError) {
        // Log to subscription_history (VULN-010)
        await supabaseAdmin.from('subscription_history').insert({
          subscription_id: sub.id,
          previous_status: 'ACTIVE',
          new_status: 'ACTIVE',
          operation: 'AUTO_RENEW',
          performed_by: null, // System automated job
          remarks: `Automatic renewal: contract end date extended to ${nextEndDate} based on ${sub.billing_frequency} cycle.`
        });

        renewedSubs.push({
          ...sub,
          new_end_date: nextEndDate
        });
      }
    }
  }

  return {
    closedCount: closedSubs.length,
    autoRenewedCount: renewedSubs.length,
    closedSubscriptions: closedSubs,
    renewedSubscriptions: renewedSubs
  };
};

/**
 * Task 7.4 – Approaching Expiries Notification Detection
 * Identifies quotations expiring in <= daysQuotation and subscriptions in <= daysSubscription
 */
export const checkApproachingExpiries = async (daysQuotation = 3, daysSubscription = 7, referenceDate = new Date()) => {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    throw new Error('Database is not configured.');
  }

  const today = new Date(referenceDate);
  const todayStr = formatDateOnly(today);

  // Quote threshold
  const quoteTarget = new Date(today);
  quoteTarget.setDate(quoteTarget.getDate() + daysQuotation);
  const quoteThresholdStr = formatDateOnly(quoteTarget);

  // Sub threshold
  const subTarget = new Date(today);
  subTarget.setDate(subTarget.getDate() + daysSubscription);
  const subThresholdStr = formatDateOnly(subTarget);

  // Query quotations expiring soon
  const { data: approachingQuotes } = await supabaseAdmin
    .from('quotations')
    .select('id, quotation_number, status, validity_date, customer_id, grand_total, customers(name, email)')
    .in('status', ['DRAFT', 'SENT'])
    .gte('validity_date', todayStr)
    .lte('validity_date', quoteThresholdStr)
    .order('validity_date', { ascending: true });

  // Query subscriptions expiring soon
  const { data: approachingSubs } = await supabaseAdmin
    .from('subscriptions')
    .select('id, subscription_number, status, end_date, auto_renew, customer_id, grand_total, customers(name, email)')
    .eq('status', 'ACTIVE')
    .not('end_date', 'is', null)
    .gte('end_date', todayStr)
    .lte('end_date', subThresholdStr)
    .order('end_date', { ascending: true });

  const notifications = [];

  // Generate notification events for quotations
  for (const q of approachingQuotes || []) {
    const diffTime = Math.max(0, new Date(q.validity_date) - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    notifications.push({
      type: 'QUOTATION_EXPIRING_SOON',
      title: `Quotation ${q.quotation_number} expiring soon`,
      message: `Quotation ${q.quotation_number} for customer ${q.customers?.name || 'Unknown'} expires in ${diffDays} day(s) on ${q.validity_date}.`,
      severity: diffDays <= 1 ? 'HIGH' : 'MEDIUM',
      targetId: q.id,
      targetNumber: q.quotation_number,
      targetDate: q.validity_date,
      daysRemaining: diffDays,
      customer: q.customers
    });
  }

  // Generate notification events for subscriptions
  for (const s of approachingSubs || []) {
    const diffTime = Math.max(0, new Date(s.end_date) - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    notifications.push({
      type: 'SUBSCRIPTION_EXPIRING_SOON',
      title: `Subscription ${s.subscription_number} term ending soon`,
      message: `Subscription ${s.subscription_number} (${s.auto_renew ? 'Auto-renews' : 'Terminates'}) reaches end date in ${diffDays} day(s) on ${s.end_date}.`,
      severity: diffDays <= 2 ? 'HIGH' : 'LOW',
      targetId: s.id,
      targetNumber: s.subscription_number,
      targetDate: s.end_date,
      daysRemaining: diffDays,
      autoRenew: s.auto_renew,
      customer: s.customers
    });
  }

  return {
    referenceDate: todayStr,
    approachingQuotationsCount: approachingQuotes?.length || 0,
    approachingSubscriptionsCount: approachingSubs?.length || 0,
    approachingQuotations: approachingQuotes || [],
    approachingSubscriptions: approachingSubs || [],
    notifications
  };
};

/**
 * Main Orchestrator: runExpiryProcessing
 * Executes quotation expiry, subscription closure/renewal, and notification detection
 * Protected by in-memory concurrency mutex (VULN-007).
 */
export const runExpiryProcessing = async (options = {}) => {
  const {
    referenceDate = new Date(),
    daysQuotation = 3,
    daysSubscription = 7
  } = options;

  // Concurrency Mutex Guard (VULN-007)
  if (isJobRunning) {
    return {
      success: false,
      skipped: true,
      message: 'Background expiry job is already actively executing. Mutex prevented concurrent execution.',
      timestamp: new Date().toISOString()
    };
  }

  isJobRunning = true;
  const startedAt = new Date();

  try {
    const quoteResults = await expireQuotations(referenceDate);
    const subResults = await closeExpiredSubscriptions(referenceDate);
    const notificationResults = await checkApproachingExpiries(daysQuotation, daysSubscription, referenceDate);

    const completedAt = new Date();
    const durationMs = completedAt - startedAt;

    lastRunAt = completedAt.toISOString();
    lastResult = {
      success: true,
      timestamp: lastRunAt,
      durationMs,
      referenceDate: formatDateOnly(referenceDate),
      quotationsExpired: quoteResults.expiredCount,
      subscriptionsClosed: subResults.closedCount,
      subscriptionsAutoRenewed: subResults.autoRenewedCount,
      notificationsGenerated: notificationResults.notifications.length,
      details: {
        quotations: quoteResults.quotations,
        closedSubscriptions: subResults.closedSubscriptions,
        renewedSubscriptions: subResults.renewedSubscriptions,
        notifications: notificationResults.notifications
      }
    };

    return lastResult;
  } catch (error) {
    lastResult = {
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    };
    throw error;
  } finally {
    isJobRunning = false;
  }
};

/**
 * Get current background runner status & telemetry
 */
export const getExpiryJobStatus = () => {
  return {
    isRunning: isJobRunning,
    lastRunAt,
    lastResult
  };
};

