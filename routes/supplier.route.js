import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import { validate } from '../middleware/validate.js';
import {
  createSupplierController,
  updateSupplierController,
  getSupplierByIdController,
  getSupplierListController,
} from '../src/supplier/supplier.controller.js';
import {
  createSupplierValidation,
  updateSupplierValidation,
  supplierIdParamValidation,
} from '../validations/supplier.validation.js';

export const supplierRouter = express.Router();

supplierRouter.post(
  '/create',
  tokenVerification,
  allowRoles('admin'),
  validate(createSupplierValidation),
  createSupplierController,
);

supplierRouter.get('/list', tokenVerification, getSupplierListController);

supplierRouter.get(
  '/:id',
  tokenVerification,
  validate(supplierIdParamValidation),
  getSupplierByIdController,
);

supplierRouter.put(
  '/update/:id',
  tokenVerification,
  allowRoles('admin'),
  validate(updateSupplierValidation),
  updateSupplierController,
);
