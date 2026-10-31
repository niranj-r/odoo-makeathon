import {
  runExpiryProcessing,
  getExpiryJobStatus,
  checkApproachingExpiries
} from '../services/expiryService.js';
import {
  startExpiryWorker,
  stopExpiryWorker,
  getWorkerTelemetry
} from '../jobs/expiryWorker.js';

/**
 * Expiry Job Controller (Member 2 - Phase 07)
 * Administrative API endpoints to monitor, trigger, and inspect automated background expiry.
 */

/**
 * POST /api/admin/jobs/run-expiry
 * Manually trigger the expiry process on-demand.
 * Supports optional referenceDate for date-shifting / simulation.
 */
export const triggerExpiryJob = async (req, res, next) => {
  try {
    const { referenceDate, daysQuotation, daysSubscription } = req.body || {};

    const options = {};
    if (referenceDate) {
      const parsed = new Date(referenceDate);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referenceDate format. Provide a valid ISO date string (YYYY-MM-DD).'
        });
      }
      options.referenceDate = parsed;
    }

    if (daysQuotation) options.daysQuotation = parseInt(daysQuotation, 10);
    if (daysSubscription) options.daysSubscription = parseInt(daysSubscription, 10);

    const result = await runExpiryProcessing(options);

    if (result.skipped) {
      return res.status(409).json({
        success: false,
        message: result.message,
        data: result
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Background expiry job executed successfully.',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/jobs/expiry-status
 * Retrieve worker state, telemetry, and last execution summary.
 */
export const getExpiryStatus = async (req, res, next) => {
  try {
    const telemetry = getWorkerTelemetry();
    return res.status(200).json({
      success: true,
      data: telemetry
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/jobs/approaching-expiries
 * Retrieve items approaching their expiration threshold and notification events.
 */
export const getApproachingExpiries = async (req, res, next) => {
  try {
    const daysQuote = parseInt(req.query.daysQuotation, 10) || 3;
    const daysSub = parseInt(req.query.daysSubscription, 10) || 7;
    const refDate = req.query.referenceDate ? new Date(req.query.referenceDate) : new Date();

    const data = await checkApproachingExpiries(daysQuote, daysSub, refDate);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/jobs/worker/start
 * Start background timer
 */
export const startWorker = async (req, res, next) => {
  try {
    const intervalMs = req.body?.intervalMs ? parseInt(req.body.intervalMs, 10) : null;
    startExpiryWorker(intervalMs);
    return res.status(200).json({
      success: true,
      message: 'Expiry worker started successfully.',
      data: getWorkerTelemetry()
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/jobs/worker/stop
 * Stop background timer
 */
export const stopWorker = async (req, res, next) => {
  try {
    stopExpiryWorker();
    return res.status(200).json({
      success: true,
      message: 'Expiry worker stopped successfully.',
      data: getWorkerTelemetry()
    });
  } catch (err) {
    next(err);
  }
};

