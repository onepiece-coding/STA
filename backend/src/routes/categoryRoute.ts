import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createCategoryCtrl,
  deleteCategoryCtrl,
  getCategoriesCtrl,
} from '../controllers/categoryController.js';
import { validateCreateCategory } from '../validations/categoryValidations.js';
import { validateObjectIdParam } from '../validations/validateObjectId.js';

const router = Router();

router.use(authenticateUser);

// /api/v1/categories
router
  .route('/')
  .post(authorizeRoles('admin'), ...validateCreateCategory, createCategoryCtrl)
  .get(
    authorizeRoles('admin', 'seller', 'instant', 'delivery'),
    getCategoriesCtrl,
  );

// /api/v1/categories/:id
router.delete(
  '/:id',
  authorizeRoles('admin'),
  validateObjectIdParam('id'),
  deleteCategoryCtrl,
);

export default router;
