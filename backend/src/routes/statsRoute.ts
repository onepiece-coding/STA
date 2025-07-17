import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import { getStatsCtrl } from '../controllers/statsController.js';
import { validateStats } from '../validations/statsValidations.js';

const router = Router();

router.use(authenticateUser);

// /api/v1/stats
router.get(
  '/',
  authorizeRoles('admin','seller', 'instant'),
  validateStats,
  getStatsCtrl
);

export default router;