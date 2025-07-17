import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import { createInstantSaleCtrl } from '../controllers/instantSaleController.js';

const router = Router();
router.use(authenticateUser, authorizeRoles('instant'));

router.post('/', createInstantSaleCtrl);

export default router;