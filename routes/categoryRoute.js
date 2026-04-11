import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import { validate } from '../middleware/validate.js';
import categoryController from '../src/admin/category/categoryController.js';
import { STAFF_ROLE } from '../utils/constants.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validations/categoryValidation.js';

const router = express.Router();

// Only admin / superadmin
router.post(
  '/create',
  tokenVerification,
  allowRoles('superadmin', 'admin'),
  validate(createCategorySchema),
  categoryController.createCategory,
);

router.get('/', tokenVerification, categoryController.getAllCategories);
router.get(
  '/categories',
  tokenVerification,
  allowRoles('superadmin', 'admin'),
  categoryController.getCategoriesForDropdown,
);
router.patch(
  '/update/:categoryId',
  tokenVerification,
  allowRoles('superadmin'),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);
router.delete(
  '/delete/:categoryId',
  tokenVerification,
  allowRoles('superadmin'),
  categoryController.deleteCategory,
);
router.get(
  '/get-by-id/:id',
  tokenVerification,
  allowRoles('superadmin'),
  categoryController.getCategoryById,
);
router.get(
  '/admin-category',
  tokenVerification,
  allowRoles('admin', ...Object.values(STAFF_ROLE)),
  categoryController.getUsedCategoriesForDropdown,
);

export const categoryRoutes = router;
