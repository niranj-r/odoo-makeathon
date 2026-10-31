import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import {
  listEmailNotifications,
  getEmailNotificationById
} from '../controllers/emailController.js';

const router = Router();

router.use(verifyAuth);
router.use(requireRoles(['ADMIN', 'STAFF']));

// Audit log of emails
router.get('/', listEmailNotifications);
router.get('/:id', getEmailNotificationById);

export default router;

