import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../middlewares/auth.js';
import { photoUpload } from '../middlewares/fileUpload.js';
import {
      createClientCtrl,
      getClientsCtrl,
      updateClientCtrl,
      deleteClientCtrl,
      getClientByIdCtrl
} from '../controllers/clientController.js';
import { validateCreateClient, validateUpdateClient  } from '../validations/clientValidations.js';
import { validateObjectIdParam } from '../validations/validateObjectId.js';

const router = Router();

// only sellers & admins can manage clients
router.use(authenticateUser);

// /api/v1/clients
router.route('/')
      .post(authorizeRoles('seller'), photoUpload.single('image'), ...validateCreateClient, createClientCtrl)
      .get(authorizeRoles('seller', 'delivery'), getClientsCtrl);

// /api/v1/clients/:id
router.route('/:id')
      .all(validateObjectIdParam('id'))
      .get(authorizeRoles('seller', 'delivery'), getClientByIdCtrl)
      .patch(authorizeRoles('seller'), photoUpload.single('image'), ...validateUpdateClient, updateClientCtrl)
      .delete(authorizeRoles('seller'), deleteClientCtrl);

export default router;