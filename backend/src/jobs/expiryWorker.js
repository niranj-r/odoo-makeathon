import { runExpiryProcessing, getExpiryJobStatus } from '../services/expiryService.js';

/**
 * Expiry Worker (Member 2 - Phase 07)
 * Runs automated expiration checks on a periodic schedule.
 * Configurable via environment variables:
 * - EXPIRY_WORKER_ENABLED (default: 'true')
 * - EXPIRY_WORKER_INTERVAL_MS (default: 3600000 = 1 hour)
 */

let workerIntervalId = null;
let isWorkerActive = false;
let workerStartedAt = null;

export const startExpiryWorker = (intervalMs = null) => {
  if (workerIntervalId) {
    console.log(' [ExpiryWorker] Worker is already running.');
    return;
  }

  const configuredInterval = intervalMs || parseInt(process.env.EXPIRY_WORKER_INTERVAL_MS, 10) || 3600000; // 1 hour default

  console.log(` [ExpiryWorker] Starting background expiry worker (Interval: ${configuredInterval / 1000}s)...`);
  isWorkerActive = true;
  workerStartedAt = new Date().toISOString();

  // Run initial check after short initial delay
  setTimeout(async () => {
    try {
      console.log(' [ExpiryWorker] Executing initial scheduled expiry check...');
      const summary = await runExpiryProcessing();
      console.log(` [ExpiryWorker] Initial check complete: ${summary.quotationsExpired} quotes expired, ${summary.subscriptionsClosed} subs closed, ${summary.subscriptionsAutoRenewed} subs renewed.`);
    } catch (err) {
      console.error('⚠️  [ExpiryWorker] Error during initial check:', err.message);
    }
  }, 5000);

  // Set recurring interval
  workerIntervalId = setInterval(async () => {
    try {
      console.log(' [ExpiryWorker] Executing recurring expiry sweep...');
      const summary = await runExpiryProcessing();
      console.log(` [ExpiryWorker] Sweep complete: ${summary.quotationsExpired} quotes expired, ${summary.subscriptionsClosed} subs closed, ${summary.subscriptionsAutoRenewed} subs renewed.`);
    } catch (err) {
      console.error('⚠️  [ExpiryWorker] Error in recurring sweep:', err.message);
    }
  }, configuredInterval);

  // Prevent background interval from holding Node process open during testing/shutdown
  if (workerIntervalId.unref) {
    workerIntervalId.unref();
  }
};

export const stopExpiryWorker = () => {
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
    isWorkerActive = false;
    console.log(' [ExpiryWorker] Background worker stopped.');
  }
};

export const getWorkerTelemetry = () => {
  const serviceStatus = getExpiryJobStatus();
  return {
    isWorkerActive,
    workerStartedAt,
    serviceStatus
  };
};

