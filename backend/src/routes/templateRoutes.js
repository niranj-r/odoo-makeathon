import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate
} from '../controllers/templateController.js';

const router = Router();

// Staff & Admin Quotation Template Operations (Supports both mount styles)
router.post(['/', '/quotation-templates'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), createTemplate);
router.get(['/', '/quotation-templates'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), listTemplates);
router.get(['/:id', '/quotation-templates/:id'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), getTemplate);
router.put(['/:id', '/quotation-templates/:id'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), updateTemplate);
router.delete(['/:id', '/quotation-templates/:id'], verifyAuth, requireRoles(['ADMIN', 'STAFF']), deleteTemplate);

export default router;
