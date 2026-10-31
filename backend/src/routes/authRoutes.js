import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  getMe,
  createStaff,
  listUsers,
  updateUserStatus
} from '../controllers/authController.js';

const router = Router();

// Current User Profile (any authenticated role)
router.get('/auth/me', verifyAuth, getMe);

// Admin-only User Management
router.post('/users/staff', verifyAuth, requireRole('ADMIN'), createStaff);
router.get('/users', verifyAuth, requireRole('ADMIN'), listUsers);
router.patch('/users/:id/status', verifyAuth, requireRole('ADMIN'), updateUserStatus);

export default router;

