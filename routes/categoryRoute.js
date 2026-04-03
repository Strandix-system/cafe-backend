import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import categoryController from '../src/admin/category/categoryController.js';

const router = express.Router();

/**
 * @openapi
 * /category/create:
 *   post:
 *     summary: Create category
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/create',
  tokenVerification,
  allowRoles('superadmin'),
  categoryController.createCategory,
);

router.get('/', tokenVerification, categoryController.getAllCategories);
router.get('/categories', categoryController.getCategoriesForDropdown);
router.patch(
  '/update/:categoryId',
  tokenVerification,
  allowRoles('superadmin'),
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
  allowRoles('admin'),
  categoryController.getUsedCategoriesForDropdown,
);

export const categoryRoutes = router;
