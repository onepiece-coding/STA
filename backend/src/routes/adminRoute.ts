import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import {
  manualAdjustCtrl,
  reassignDeliveryBulkCtrl,
  reassignSellerBulkCtrl,
} from '../controllers/adminController.js';

const router = Router();

router.use(authenticateUser,  authorizeRoles('admin'));

// /api/v1/admin/adjust-stock
router.post('/adjust-stock', manualAdjustCtrl);

// /api/v1/admin/reassign/seller
router.post('/reassign/seller',   reassignSellerBulkCtrl);

// /api/v1/admin/reassign/delivery
router.post('/reassign/delivery', reassignDeliveryBulkCtrl);


export default router;