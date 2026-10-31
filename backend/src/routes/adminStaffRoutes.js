import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  listStaff,
  getStaffById,
  inviteOrAddStaff,
  updateStaff,
  updateStaffStatus,
  getStaffActivity
} from '../controllers/adminStaffController.js';

const router = Router();

// All admin staff management routes strictly require verified ADMIN role
router.use(verifyAuth, requireRole('ADMIN'));

router.get('/', listStaff);
router.post('/invite', inviteOrAddStaff);
router.post('/', inviteOrAddStaff);
router.get('/:id/activity', getStaffActivity);
router.get('/:id', getStaffById);
router.patch('/:id', updateStaff);
router.patch('/:id/status', updateStaffStatus);

export default router;

