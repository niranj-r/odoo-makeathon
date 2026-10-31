import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import {
  sanitizeString,
  isValidUUID
} from '../utils/validators.js';

/**
 * Subscription Lifecycle Controller (Member 2 - Phase 06)
 * Enforces discrete state machine transitions and immutable audit logging.
 *
 * Supported Statuses:
 * - DRAFT: Initial preparation stage
 * - CONFIRMED: Verified and ready for activation
 * - ACTIVE: Operational and running
 * - PAUSED: Temporarily suspended
 * - CLOSED: Permanently closed
 * - CANCELLED: Terminated
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

// Helper: Record immutable lifecycle history entry (VULN-010)
const recordHistory = async (subscriptionId, previousStatus, newStatus, operation, userId, remarks = null) => {
  try {
    await supabaseAdmin.from('subscription_history').insert({
      subscription_id: subscriptionId,
      previous_status: previousStatus,
      new_status: newStatus,
      operation,
      performed_by: userId,
      remarks: sanitizeString(remarks, 1000)
    });
  } catch (err) {
    console.error('Warning: Failed to record lifecycle history:', err);
  }
};

/**
 * Task 6.2 – Subscription Confirmation
 * POST /api/subscriptions/:id/confirm
 * Permitted Transition: DRAFT -> CONFIRMED
 */
export const confirmSubscription = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format.'
      });
    }

    const { data: sub, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, status, payment_terms, grand_total, customer:customers(id, status)')
      .eq('id', id)
      .single();

    if (fetchError || !sub) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found.'
      });
    }

    // State validation
    if (sub.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Only DRAFT subscriptions can be confirmed. Current status: ${sub.status}.`
      });
    }

    // Verification of customer standing
    if (sub.customer && sub.customer.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Cannot confirm subscription for an inactive customer.'
      });
    }

    const now = new Date().toISOString();
    const { data: updatedSub, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'CONFIRMED',
        confirmed_at: now,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to confirm subscription.',
        error: updateError.message
      });
    }

    await recordHistory(
      id,
      'DRAFT',
      'CONFIRMED',
      'CONFIRM',
      req.user?.id || null,
      req.body?.remarks || 'Subscription verified and confirmed by staff'
    );

    return res.status(200).json({
      success: true,
      message: `Subscription ${sub.subscription_number} has been confirmed. Ready for activation.`,
      subscription: updatedSub
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 6.3 – Subscription Activation
 * POST /api/subscriptions/:id/activate
 * Permitted Transition: CONFIRMED -> ACTIVE
 */
export const activateSubscription = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format.'
      });
    }

    const { data: sub, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, status, start_date')
      .eq('id', id)
      .single();

    if (fetchError || !sub) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found.'
      });
    }

    // State validation: Must be CONFIRMED before activation (VULN-003)
    if (sub.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: `Subscription must be in CONFIRMED status before activation. Current status: ${sub.status}.`
      });
    }

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const startDate = req.body?.start_date || sub.start_date || today;

    const { data: updatedSub, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'ACTIVE',
        start_date: startDate,
        activated_at: now,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to activate subscription.',
        error: updateError.message
      });
    }

    await recordHistory(
      id,
      'CONFIRMED',
      'ACTIVE',
      'ACTIVATE',
      req.user?.id || null,
      req.body?.remarks || `Subscription activated with start date ${startDate}`
    );

    return res.status(200).json({
      success: true,
      message: `Subscription ${sub.subscription_number} is now ACTIVE.`,
      subscription: updatedSub
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 6.4 – Pause Subscription
 * POST /api/subscriptions/:id/pause
 * Permitted Transition: ACTIVE -> PAUSED
 */
export const pauseSubscription = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;
    const { reason = 'Suspended on customer request' } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format.'
      });
    }

    const { data: sub, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, status')
      .eq('id', id)
      .single();

    if (fetchError || !sub) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found.'
      });
    }

    if (sub.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Only ACTIVE subscriptions can be paused. Current status: ${sub.status}.`
      });
    }

    const now = new Date().toISOString();
    const cleanReason = sanitizeString(reason, 500) || 'Temporary pause';

    const { data: updatedSub, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'PAUSED',
        pause_reason: cleanReason,
        paused_at: now,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to pause subscription.',
        error: updateError.message
      });
    }

    await recordHistory(
      id,
      'ACTIVE',
      'PAUSED',
      'PAUSE',
      req.user?.id || null,
      `Paused: ${cleanReason}`
    );

    return res.status(200).json({
      success: true,
      message: `Subscription ${sub.subscription_number} paused.`,
      subscription: updatedSub
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 6.5 – Resume Subscription
 * POST /api/subscriptions/:id/resume
 * Permitted Transition: PAUSED -> ACTIVE
 */
export const resumeSubscription = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format.'
      });
    }

    const { data: sub, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, status')
      .eq('id', id)
      .single();

    if (fetchError || !sub) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found.'
      });
    }

    if (sub.status !== 'PAUSED') {
      return res.status(400).json({
        success: false,
        message: `Only PAUSED subscriptions can be resumed. Current status: ${sub.status}.`
      });
    }

    const now = new Date().toISOString();
    const { data: updatedSub, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'ACTIVE',
        pause_reason: null,
        resumed_at: now,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to resume subscription.',
        error: updateError.message
      });
    }

    await recordHistory(
      id,
      'PAUSED',
      'ACTIVE',
      'RESUME',
      req.user?.id || null,
      req.body?.remarks || 'Subscription resumed by staff'
    );

    return res.status(200).json({
      success: true,
      message: `Subscription ${sub.subscription_number} resumed and is now ACTIVE.`,
      subscription: updatedSub
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 6.6 – Renew Subscription
 * POST /api/subscriptions/:id/renew
 * Extends active/confirmed subscription by 1 billing cycle interval
 */
export const renewSubscription = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format.'
      });
    }

    const { data: sub, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, status, billing_frequency, start_date, end_date')
      .eq('id', id)
      .single();

    if (fetchError || !sub) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found.'
      });
    }

    if (!['ACTIVE', 'CONFIRMED'].includes(sub.status)) {
      return res.status(400).json({
        success: false,
        message: `Subscription cannot be renewed in '${sub.status}' status. Must be ACTIVE or CONFIRMED.`
      });
    }

    // Calculate new end date based on billing_frequency
    const baseDate = sub.end_date ? new Date(sub.end_date) : new Date();
    const nextEndDate = new Date(baseDate);

    switch (sub.billing_frequency) {
      case 'daily':
        nextEndDate.setDate(nextEndDate.getDate() + 1);
        break;
      case 'weekly':
        nextEndDate.setDate(nextEndDate.getDate() + 7);
        break;
      case 'yearly':
        nextEndDate.setFullYear(nextEndDate.getFullYear() + 1);
        break;
      case 'monthly':
      default:
        nextEndDate.setMonth(nextEndDate.getMonth() + 1);
        break;
    }

    const newEndDateStr = nextEndDate.toISOString().split('T')[0];
    const now = new Date().toISOString();

    const { data: updatedSub, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        end_date: newEndDateStr,
        auto_renew: true,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to renew subscription.',
        error: updateError.message
      });
    }

    await recordHistory(
      id,
      sub.status,
      sub.status,
      'RENEW',
      req.user?.id || null,
      `Subscription renewed: end date extended to ${newEndDateStr} (${sub.billing_frequency} interval)`
    );

    return res.status(200).json({
      success: true,
      message: `Subscription ${sub.subscription_number} renewed until ${newEndDateStr}.`,
      subscription: updatedSub
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 6.7 – Cancel Subscription
 * POST /api/subscriptions/:id/cancel
 * Permitted Transition: DRAFT/CONFIRMED/ACTIVE/PAUSED -> CANCELLED
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;
    const { reason = 'Cancelled by staff/customer' } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format.'
      });
    }

    const { data: sub, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, status')
      .eq('id', id)
      .single();

    if (fetchError || !sub) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found.'
      });
    }

    // Terminal statuses cannot be cancelled again
    if (['CLOSED', 'CANCELLED'].includes(sub.status)) {
      return res.status(400).json({
        success: false,
        message: `Subscription is already in terminal state '${sub.status}'.`
      });
    }

    const now = new Date().toISOString();
    const cleanReason = sanitizeString(reason, 500) || 'Terminated';

    const { data: updatedSub, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'CANCELLED',
        cancellation_reason: cleanReason,
        cancelled_at: now,
        auto_renew: false,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel subscription.',
        error: updateError.message
      });
    }

    await recordHistory(
      id,
      sub.status,
      'CANCELLED',
      'CANCEL',
      req.user?.id || null,
      `Cancellation reason: ${cleanReason}`
    );

    return res.status(200).json({
      success: true,
      message: `Subscription ${sub.subscription_number} has been CANCELLED.`,
      subscription: updatedSub
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 6.8 – Close Subscription
 * POST /api/subscriptions/:id/close
 * Permitted Transition: ACTIVE/PAUSED -> CLOSED
 */
export const closeSubscription = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;
    const { reason = 'Contract concluded or term expired' } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format.'
      });
    }

    const { data: sub, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, status')
      .eq('id', id)
      .single();

    if (fetchError || !sub) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found.'
      });
    }

    if (!['ACTIVE', 'PAUSED'].includes(sub.status)) {
      return res.status(400).json({
        success: false,
        message: `Only ACTIVE or PAUSED subscriptions can be closed. Current status: ${sub.status}.`
      });
    }

    const now = new Date().toISOString();
    const cleanReason = sanitizeString(reason, 500);

    const { data: updatedSub, error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'CLOSED',
        closed_at: now,
        auto_renew: false,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to close subscription.',
        error: updateError.message
      });
    }

    await recordHistory(
      id,
      sub.status,
      'CLOSED',
      'CLOSE',
      req.user?.id || null,
      cleanReason || 'Subscription closed'
    );

    return res.status(200).json({
      success: true,
      message: `Subscription ${sub.subscription_number} has been CLOSED.`,
      subscription: updatedSub
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Task 6.9 – Retrieve Subscription Lifecycle History
 * GET /api/subscriptions/:id/history
 */
export const getSubscriptionHistory = async (req, res, next) => {
  try {
    if (!ensureSupabase(res)) return;

    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format.'
      });
    }

    // Verify subscription exists
    const { data: sub, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, subscription_number, status')
      .eq('id', id)
      .single();

    if (subError || !sub) {
      return res.status(404).json({
        success: false,
        message: `Subscription with ID '${id}' was not found.`
      });
    }

    const { data: history, error: historyError } = await supabaseAdmin
      .from('subscription_history')
      .select(`
        id,
        subscription_id,
        previous_status,
        new_status,
        operation,
        remarks,
        timestamp,
        performer:profiles (
          id,
          full_name,
          email,
          role
        )
      `)
      .eq('subscription_id', id)
      .order('timestamp', { ascending: true });

    if (historyError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve subscription history.',
        error: historyError.message
      });
    }

    return res.status(200).json({
      success: true,
      subscription_id: id,
      subscription_number: sub.subscription_number,
      current_status: sub.status,
      historyCount: (history || []).length,
      history: history || []
    });
  } catch (err) {
    next(err);
  }
};
