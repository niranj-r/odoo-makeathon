import express from 'express';
import { getReportsSummary, exportReportCsv } from '../controllers/reportController.js';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';

const router = express.Router();

router.get('/summary', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getReportsSummary);
router.get('/', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getReportsSummary);
router.get('/export', verifyAuth, requireRoles(['ADMIN', 'STAFF']), exportReportCsv);

export default router;
