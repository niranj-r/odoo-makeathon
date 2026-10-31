import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';

const router = Router();

// GET /api/dashboard/stats - Fetch live system counts from Supabase
router.get('/stats', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getDashboardStats);

export default router;

