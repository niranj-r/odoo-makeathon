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

// Staff & Admin Quotation Template Operations
router.post('/quotation-templates', verifyAuth, requireRoles(['ADMIN', 'STAFF']), createTemplate);
router.get('/quotation-templates', verifyAuth, requireRoles(['ADMIN', 'STAFF']), listTemplates);
router.get('/quotation-templates/:id', verifyAuth, requireRoles(['ADMIN', 'STAFF']), getTemplate);
router.put('/quotation-templates/:id', verifyAuth, requireRoles(['ADMIN', 'STAFF']), updateTemplate);
router.delete('/quotation-templates/:id', verifyAuth, requireRoles(['ADMIN', 'STAFF']), deleteTemplate);

export default router;
