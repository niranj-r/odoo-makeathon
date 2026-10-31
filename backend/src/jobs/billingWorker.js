import { runBillingRun } from '../services/billingService.js';

let isRunning = false;
let workerIntervalId = null;
let lastRunTimestamp = null;
let lastRunSummary = null;

/**
 * Executes a single iteration of the automated billing scheduler with concurrency mutex.
 */
export const executeBillingCycle = async (referenceDate = new Date(), triggeredBy = 'CRON_SCHEDULER') => {
  if (isRunning) {
    console.warn(`[BillingWorker] Run skipped: another billing cycle is currently active.`);
    return {
      success: false,
      skipped: true,
      reason: 'Concurrent execution lock is active.'
    };
  }

  isRunning = true;
  const startTime = Date.now();
  console.log(`⏱️  [BillingWorker] Starting automated billing sweep (Trigger: ${triggeredBy})...`);

  try {
    const summary = await runBillingRun(referenceDate, null);
    lastRunTimestamp = new Date().toISOString();
    lastRunSummary = {
      ...summary,
      durationMs: Date.now() - startTime,
      triggeredBy
    };

    console.log(
      ` [BillingWorker] Completed billing run in ${lastRunSummary.durationMs}ms. ` +
      `Generated: ${summary.generatedCount}, Duplicates Skipped: ${summary.skippedDuplicateCount}, Errors: ${summary.errorCount}`
    );

    return {
      success: true,
      data: lastRunSummary
    };
  } catch (err) {
    console.error(`❌ [BillingWorker] Unexpected failure during billing execution:`, err);
    return {
      success: false,
      error: err.message
    };
  } finally {
    isRunning = false;
  }
};

/**
 * Returns current worker status & health metrics
 */
export const getBillingWorkerStatus = () => {
  return {
    isWorkerActive: Boolean(workerIntervalId),
    isRunningMutex: isRunning,
    lastRunTimestamp,
    lastRunSummary
  };
};

/**
 * Starts periodic automated scheduler (default: every 60 minutes)
 */
export const startBillingWorker = (intervalMinutes = 60) => {
  if (workerIntervalId) {
    console.log('[BillingWorker] Worker is already active.');
    return;
  }

  const ms = Math.max(1, intervalMinutes) * 60 * 1000;
  console.log(` [BillingWorker] Scheduled worker started with interval: ${intervalMinutes} minutes.`);

  // Optional: trigger immediate first check in background
  executeBillingCycle(new Date(), 'WORKER_STARTUP').catch((err) =>
    console.warn('[BillingWorker] Initial startup sweep failed:', err.message)
  );

  workerIntervalId = setInterval(() => {
    executeBillingCycle(new Date(), 'INTERVAL_TICK').catch((err) =>
      console.warn('[BillingWorker] Interval tick failed:', err.message)
    );
  }, ms);
};

/**
 * Stops periodic scheduler
 */
export const stopBillingWorker = () => {
  if (workerIntervalId) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;
    console.log('🛑 [BillingWorker] Background worker stopped.');
  }
};

