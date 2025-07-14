import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import {
  createSectorCtrl,
  getSectorsByCityCtrl,
  deleteSectorCtrl
} from '../controllers/sectorController.js';
import {
  validateCreateSector,
} from '../validations/cityValidations.js';
import { validateObjectIdParam } from '../validations/validateObjectId.js';

const router = Router();
router.use(authenticateUser);

// /api/v1/sectors/
router.post('/', authorizeRoles('admin'), ...validateCreateSector, createSectorCtrl);

// /api/v1/sectors/:cityId/sectors
router.get('/:cityId/sectors', authorizeRoles('admin', 'seller'), validateObjectIdParam('cityId'), getSectorsByCityCtrl);

// /api/v1/sectors/:id
router.delete('/:id', authorizeRoles('admin'), validateObjectIdParam('id'), deleteSectorCtrl);

export default router;