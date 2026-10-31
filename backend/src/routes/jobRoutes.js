import express from 'express';
import {
  triggerExpiryJob,
  getExpiryStatus,
  getApproachingExpiries,
  startWorker,
  stopWorker
} from '../controllers/expiryJobController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';

const router = express.Router();

// All background job management endpoints require Staff or Admin privileges
router.use(verifyAuth);
router.use(requireRoles(['ADMIN', 'STAFF']));

router.post('/admin/jobs/run-expiry', triggerExpiryJob);
router.get('/admin/jobs/expiry-status', getExpiryStatus);
router.get('/admin/jobs/approaching-expiries', getApproachingExpiries);
router.post('/admin/jobs/worker/start', startWorker);
router.post('/admin/jobs/worker/stop', stopWorker);

export default router;

