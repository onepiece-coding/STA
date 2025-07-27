import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import { createInstantSaleCtrl } from '../controllers/instantSaleController.js';

const router = Router();
router.use(authenticateUser, authorizeRoles('instant'));

// /api/v1/instant-sales
router.post('/', createInstantSaleCtrl);

export default router;
