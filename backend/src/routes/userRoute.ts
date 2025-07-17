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
  getInstantSellerByIdCtrl,
  getInstantSellersCtrl,
  updateInstantSellerCtrl,
  deleteInstantSellerCtrl,
} from '../controllers/userController.js';
import {
  validateCreateSeller,
  validateCreateDelivery,
} from '../validations/userValidations.js';
import { validateObjectIdParam } from '../validations/validateObjectId.js';
import { createInstantSaleCtrl } from '../controllers/instantSaleController.js';

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

// /api/v1/users/instant-sellers
router
  .route('/instant-sellers')
  .all(authorizeRoles('admin'))
  .post(...validateCreateSeller, createInstantSaleCtrl)
  .get(getInstantSellersCtrl);

// /api/v1/users/instant-seller/:id
router
  .route('/instant-sellers/:id')
  .all(validateObjectIdParam('id'))
  .get(authorizeRoles('admin'), getInstantSellerByIdCtrl)
  .patch(authorizeRoles('admin'), updateInstantSellerCtrl)
  .delete(authorizeRoles('admin'), deleteInstantSellerCtrl);


export default router;
