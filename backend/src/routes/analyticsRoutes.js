import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';

const router = express.Router();

router.get('/', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getAnalytics);
router.get('/summary', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getAnalytics);

export default router;
