import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import {
  runBillingScheduler,
  getDueSubscriptions,
  getBillingStatus,
  startWorkerAction,
  stopWorkerAction
} from '../controllers/billingJobController.js';

const router = Router();

router.use(verifyAuth);
router.use(requireRoles(['ADMIN', 'STAFF']));

// Trigger billing run on-demand
router.post('/run-scheduler', runBillingScheduler);

// Preview subscriptions currently due for billing
router.get('/due-subscriptions', getDueSubscriptions);

// Worker status and telemetry
router.get('/status', getBillingStatus);

// Worker controls
router.post('/worker/start', startWorkerAction);
router.post('/worker/stop', stopWorkerAction);

export default router;

