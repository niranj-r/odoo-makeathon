import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';

const router = express.Router();

// Allow Admin and Staff to view executive dashboard metrics
router.get('/summary', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getDashboardSummary);
router.get('/', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getDashboardSummary);

export default router;
