import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';
import { resolveOutletAccessContext } from '../../../utils/adminAccess.js';

import { categoryService } from './categoryService.js';

export default {
  createCategory: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.body.outletId ?? req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.body.adminId ?? req.query.adminId,
      },
    );
    const result = await categoryService.createCategory(context, req.body);
    sendSuccessResponse(res, 201, 'Category created successfully', result);
  },
  getAllCategories: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.query.adminId,
      },
    );
    const filter = pick(req.query, ['search', 'type']);
    const options = pick(req.query, ['page', 'limit', 'sortBy']);
    const categories = await categoryService.getAllCategories(
      context,
      filter,
      options,
    );
    sendSuccessResponse(
      res,
      200,
      'Categories fetched successfully',
      categories,
    );
  },
  updateCategory: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.body.outletId ?? req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.body.adminId ?? req.query.adminId,
      },
    );
    const category = await categoryService.updateCategoryById(
      req.params.categoryId,
      context,
      req.body,
    );
    sendSuccessResponse(res, 200, 'Category updated successfully', category);
  },
  deleteCategory: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.body?.outletId ?? req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.body?.adminId ?? req.query.adminId,
      },
    );
    await categoryService.deleteCategoryById(req.params.categoryId, context);
    sendSuccessResponse(res, 200, 'Category deleted successfully');
  },
  getCategoriesForDropdown: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.query.adminId,
      },
    );
    const filter = pick(req.query, ['type']);
    const categories = await categoryService.getCategoriesForDropdown(
      context,
      filter,
    );
    sendSuccessResponse(
      res,
      200,
      'Categories fetched successfully',
      categories,
    );
  },
  getCategoryById: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.query.adminId,
      },
    );
    const category = await categoryService.getCategoryById(
      req.params.id,
      context,
    );
    sendSuccessResponse(res, 200, 'Category fetched successfully', category);
  },
  getUsedCategoriesForDropdown: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.query.adminId,
      },
    );
    const result = await categoryService.getUsedCategoriesForDropdown(
      context,
    );
    sendSuccessResponse(res, 200, 'Categories fetched successfully', result);
  },
};
