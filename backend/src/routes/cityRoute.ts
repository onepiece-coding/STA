import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createCityCtrl,
  getCitiesCtrl,
  deleteCityCtrl
} from '../controllers/cityController.js';
import { validateCreateCity } from '../validations/cityValidations.js';
import { validateObjectIdParam } from '../validations/validateObjectId.js';

const router = Router();
router.use(authenticateUser);

// /api/v1/cities
router.post('/', authorizeRoles('admin'), ...validateCreateCity, createCityCtrl);
router.get('/', authorizeRoles('admin', 'seller'), getCitiesCtrl);

// /api/v1/cities/:id
router.delete('/:id', authorizeRoles('admin'), validateObjectIdParam('id'), deleteCityCtrl);

export default router;