import { Router } from 'express';
import { verifyAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  getMe,
  listUsers,
  listStaff,
  getUserById,
  updateUser,
  createStaff,
  updateUserStatus
} from '../controllers/authController.js';

const router = Router();

// Current User Profile (any authenticated role)
router.get('/auth/me', verifyAuth, getMe);

// Admin-only Staff Management (Must be placed before /users/:id to avoid conflict)
router.get('/users/staff', verifyAuth, requireRole('ADMIN'), listStaff);
router.post('/users/staff', verifyAuth, requireRole('ADMIN'), createStaff);

// Admin-only User Management
router.get('/users', verifyAuth, requireRole('ADMIN'), listUsers);
router.get('/users/:id', verifyAuth, requireRole('ADMIN'), getUserById);
router.patch('/users/:id', verifyAuth, requireRole('ADMIN'), updateUser);
router.patch('/users/:id/status', verifyAuth, requireRole('ADMIN'), updateUserStatus);

export default router;
