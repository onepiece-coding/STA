import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createSaleCtrl,
  updateSaleCtrl,
  getSalesCtrl,
  getSaleByIdCtrl
} from '../controllers/saleController.js';
import {
  validateCreateSale,
  validateUpdateSale
} from '../validations/saleValidations.js';
import { validateObjectIdParam } from '../validations/validateObjectId.js';

const router = Router();

router.use(authenticateUser);

// /api/v1/sales
router.route('/')
      .post(authorizeRoles('seller'), ...validateCreateSale, createSaleCtrl)
      .get(authorizeRoles('seller','delivery'), getSalesCtrl);

// /api/v1/sales/:id
router.route('/:id')
      .all(validateObjectIdParam('id'))
      .get(authorizeRoles('seller', 'delivery'), getSaleByIdCtrl)
      .patch(authorizeRoles('delivery'), ...validateUpdateSale, updateSaleCtrl)


export default router;