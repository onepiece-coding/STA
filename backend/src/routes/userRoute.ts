import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createSellerCtrl,
  getSellersCtrl,
  updateSellerCtrl,
  deleteSellerCtrl,
  createDeliveryCtrl,
  getDeliveryCtrl,
  updateDeliveryCtrl,
  deleteDeliveryCtrl,
  getSellerByIdCtrl,
  getDeliveryByIdCtrl,
} from '../controllers/userController.js';
import {
  validateCreateSeller,
  validateCreateDelivery,
} from '../validations/userValidations.js';
import { validateObjectIdParam } from '../validations/validateObjectId.js';

const router = Router();
router.use(authenticateUser);

// /api/v1/users/sellers
router
  .route('/sellers')
  .all(authorizeRoles('admin'))
  .post(...validateCreateSeller, createSellerCtrl)
  .get(getSellersCtrl);

// /api/v1/users/seller/:id
router
  .route('/sellers/:id')
  .all(validateObjectIdParam('id'))
  .get(authorizeRoles('admin'), getSellerByIdCtrl)
  .patch(authorizeRoles('admin'), updateSellerCtrl)
  .delete(authorizeRoles('admin'), deleteSellerCtrl);

// /api/v1/users/delivery
router
  .route('/delivery')
  .post(authorizeRoles('admin'), ...validateCreateDelivery, createDeliveryCtrl)
  .get(authorizeRoles('admin', 'seller'), getDeliveryCtrl);

// /api/v1/users/delivery/:id
router
  .route('/delivery/:id')
  .all(validateObjectIdParam('id'))
  .get(authorizeRoles('admin'), getDeliveryByIdCtrl)
  .patch(authorizeRoles('admin'), updateDeliveryCtrl)
  .delete(authorizeRoles('admin', 'delivery'), deleteDeliveryCtrl);

export default router;
