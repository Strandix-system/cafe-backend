import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { uploadInventoryImages } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  createInventoryController,
  getInventoryListController,
  getInventoryByIdController,
  updateInventoryController,
} from '../src/inventory/inventory.controller.js';
import {
  createInventoryValidation,
  updateInventoryValidation,
  getInventoryByIdValidation,
} from '../validations/inventory.validation.js';

export const inventoryRouter = express.Router();

inventoryRouter.post(
  '/create',
  tokenVerification,
  uploadInventoryImages.single('image'),
  validate(createInventoryValidation),
  createInventoryController,
);

inventoryRouter.get('/list', tokenVerification, getInventoryListController);

inventoryRouter.get(
  '/:id',
  tokenVerification,
  validate(getInventoryByIdValidation),
  getInventoryByIdController,
);

inventoryRouter.put(
  '/update/:id',
  tokenVerification,
  uploadInventoryImages.single('image'),
  validate(updateInventoryValidation),
  updateInventoryController,
);
