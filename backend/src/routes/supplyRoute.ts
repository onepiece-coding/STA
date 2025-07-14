import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import { validateAddBulkSupply } from '../validations/supplyValidations.js'
import {
  addBulkSupplyCtrl,
  lowStockAlertsCtrl,
  expiringSoonAlertsCtrl
} from '../controllers/supplyController.js';

const router = Router();

// All supply and alert routes are admin‑only
router.use(authenticateUser, authorizeRoles('admin'));

// /api/v1/supplies
router.post('/', ...validateAddBulkSupply, addBulkSupplyCtrl);

// /api/v1/supplies/alerts/low-stock
router.get('/alerts/low-stock',  lowStockAlertsCtrl);

// /api/v1/supplies/alerts/expiring
router.get('/alerts/expiring',   expiringSoonAlertsCtrl);

export default router;