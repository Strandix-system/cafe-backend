import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import { validate } from '../middleware/validate.js';
import categoryController from '../src/admin/category/categoryController.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validations/categoryValidation.js';

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
  allowRoles('superadmin', 'admin'),
  validate(createCategorySchema),
  categoryController.createCategory,
);

/**
 * @openapi
 * /category:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 *       401:
 *         description: Unauthorized
 */

router.get('/', tokenVerification, categoryController.getAllCategories);

router.get(
  '/categories',
  tokenVerification,
  allowRoles('superadmin', 'admin'),
  categoryController.getCategoriesForDropdown,
);

/**
 * @openapi
 * /category/update/{categoryId}:
 *   patch:
 *     summary: Update category
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryRequest'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */

router.patch(
  '/update/:categoryId',
  tokenVerification,
  allowRoles('superadmin'),
  validate(updateCategorySchema),
  categoryController.updateCategory,
);

/**
 * @openapi
 * /category/delete/{categoryId}:
 *   delete:
 *     summary: Delete category
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 */
router.delete(
  '/delete/:categoryId',
  tokenVerification,
  allowRoles('superadmin'),
  categoryController.deleteCategory,
);

/**
 * @openapi
 * /category/get-by-id/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category fetched successfully
 *       404:
 *         description: Category not found
 */
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
