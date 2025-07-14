import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import { createCategoryCtrl, deleteCategoryCtrl, getCategoryCtrl } from '../controllers/categoryController.js';
import { validateCreateCategory } from '../validations/categoryValidations.js';
import { validateObjectIdParam } from '../validations/validateObjectId.js';

const router = Router();

router.use(authenticateUser, authorizeRoles("admin"));

// /api/v1/categories
router.route('/')
      .post(...validateCreateCategory, createCategoryCtrl)
      .get(getCategoryCtrl);

// /api/v1/categories/:id
router.delete('/:id',validateObjectIdParam('id'), deleteCategoryCtrl);

export default router;