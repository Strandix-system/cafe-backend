import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import { validate } from '../middleware/validate.js';
import {
  createPurchaseController,
  getPurchaseListController,
  getPurchaseByIdController,
} from '../src/inventoryPurchase/iinventoryPurchase.controller.js';
import { createPurchaseValidation } from '../validations/inventoryPurchase.validation.js';

export const purchaseRouter = express.Router();

purchaseRouter.post(
  '/create',
  tokenVerification,
  allowRoles('admin'),
  validate(createPurchaseValidation),
  createPurchaseController,
);
purchaseRouter.get('/list', tokenVerification, getPurchaseListController);
purchaseRouter.get(
  '/:purchaseId',
  tokenVerification,
  getPurchaseByIdController,
);
