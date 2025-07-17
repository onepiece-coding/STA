import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createCityCtrl,
  getCitiesCtrl,
  deleteCityCtrl,
  getCityByIdCtrl,
  updateCityCtrl
} from '../controllers/cityController.js';
import { validateCreateCity } from '../validations/cityValidations.js';
import { validateObjectIdParam } from '../validations/validateObjectId.js';

const router = Router();
router.use(authenticateUser);

// /api/v1/cities
router.post('/', authorizeRoles('admin'), ...validateCreateCity, createCityCtrl);
router.get('/', authorizeRoles('admin', 'seller', 'instant'), getCitiesCtrl);

// /api/v1/cities/:id
router.route("/:id")
      .all(validateObjectIdParam('id'))
      .get(authorizeRoles('admin', 'seller', 'instant'), getCityByIdCtrl)
      .patch(authorizeRoles('admin'), updateCityCtrl)
      .delete(authorizeRoles('admin'), deleteCityCtrl);

export default router;