import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import { createProductCtrl, deleteProductCtrl, getDiscountedProductsCtrl, getProductByIdCtrl, getProductsCtrl, manualAdjustCtrl, updateProductCtrl } from '../controllers/productController.js';
import { photoUpload } from '../middlewares/fileUpload.js';
import { validateCreateProduct, validateUpdateProduct } from '../validations/productValidations.js';
import { validateObjectIdParam } from '../validations/validateObjectId.js';

const router = Router();

router.use(authenticateUser);

// /api/v1/products
router.route('/')
      .post(authorizeRoles('admin'), photoUpload.single('image'), ...validateCreateProduct, createProductCtrl)
      .get(getProductsCtrl);

// /api/v1/products/discounts
router.get('/discounts',authorizeRoles('admin', 'seller'), getDiscountedProductsCtrl);

// /api/v1/products/:id
router.route('/:id')
      .all(validateObjectIdParam('id'))
      .get(getProductByIdCtrl)
      .patch(authorizeRoles('admin'), photoUpload.single('image'), ...validateUpdateProduct, updateProductCtrl)
      .delete(authorizeRoles('admin'), deleteProductCtrl);

// /api/v1/products/adjust
router.post('/adjust', authorizeRoles("admin"), manualAdjustCtrl);

export default router;