import {
  findSubscriptionsDueForBilling,
  runBillingRun
} from '../services/billingService.js';
import {
  executeBillingCycle,
  getBillingWorkerStatus,
  startBillingWorker,
  stopBillingWorker
} from '../jobs/billingWorker.js';

/**
 * POST /api/admin/billing/run-scheduler
 * On-demand manual trigger for automated billing execution.
 */
export const runBillingScheduler = async (req, res, next) => {
  try {
    const referenceDate = req.body?.referenceDate || new Date();
    const result = await executeBillingCycle(referenceDate, 'API_ADMIN_TRIGGER');

    if (!result.success && result.skipped) {
      return res.status(409).json({
        success: false,
        message: 'A billing sweep is already actively running. Please wait for completion.'
      });
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Billing scheduler execution encountered errors.'
      });
    }

    return res.json({
      success: true,
      message: 'Automated billing scheduler run completed.',
      data: result.data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/billing/due-subscriptions
 * Previews all subscriptions that are due for billing on a given date.
 */
export const getDueSubscriptions = async (req, res, next) => {
  try {
    const referenceDate = req.query?.referenceDate || new Date();
    const dueList = await findSubscriptionsDueForBilling(referenceDate);

    return res.json({
      success: true,
      referenceDate,
      totalDue: dueList.length,
      data: dueList
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/billing/status
 * Returns current status of the billing background worker.
 */
export const getBillingStatus = async (req, res, next) => {
  try {
    const status = getBillingWorkerStatus();
    return res.json({
      success: true,
      data: status
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/billing/worker/start
 * Activates background periodic interval worker.
 */
export const startWorkerAction = async (req, res, next) => {
  try {
    const intervalMinutes = parseInt(req.body?.intervalMinutes, 10) || 60;
    startBillingWorker(intervalMinutes);

    return res.json({
      success: true,
      message: `Billing background worker started with interval of ${intervalMinutes} minutes.`
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/billing/worker/stop
 * Halts background periodic interval worker.
 */
export const stopWorkerAction = async (req, res, next) => {
  try {
    stopBillingWorker();

    return res.json({
      success: true,
      message: 'Billing background worker halted.'
    });
  } catch (err) {
    next(err);
  }
};

