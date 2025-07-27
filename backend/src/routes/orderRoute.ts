import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createOrderCtrl,
  getOrdersCtrl,
  getOrderByIdCtrl,
  updateOrderCtrl,
  deleteOrderCtrl,
} from '../controllers/orderController.js';
import {
  validateCreateOrder,
  validateGetOrders,
  validateUpdateOrder,
} from '../validations/orderValidations.js';
import { validateObjectIdParam } from '../validations/validateObjectId.js';

const router = Router();
router.use(authenticateUser);

// /api/v1/orders
router
  .route('/')
  .post(authorizeRoles('delivery'), ...validateCreateOrder, createOrderCtrl)
  .get(authorizeRoles('delivery', 'seller'), validateGetOrders, getOrdersCtrl);

// /api/v1/orders/:id
router
  .route('/:id')
  .all(authorizeRoles('delivery', 'seller'), validateObjectIdParam('id'))
  .get(getOrderByIdCtrl)
  .patch(...validateUpdateOrder, updateOrderCtrl)
  .delete(deleteOrderCtrl);

export default router;
