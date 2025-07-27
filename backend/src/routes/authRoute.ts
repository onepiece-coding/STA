import { Router } from 'express';
import {
  changePasswordCtrl,
  getCurrentUser,
  loginUserCtrl,
} from '../controllers/authController.js';
import { validateLoginUser } from '../validations/userValidations.js';
import { authenticateUser } from '../middlewares/auth.js';

const router = Router();

// /api/v1/auth/login
router.post('/login', ...validateLoginUser, loginUserCtrl);

// /api/v1/auth/current-user
router.get('/current-user', authenticateUser, getCurrentUser);

// /api/v1/auth/change-password
router.post('/change-password', authenticateUser, changePasswordCtrl);

export default router;
