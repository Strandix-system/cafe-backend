import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';

import { menuService } from './service.js';

export const menuController = {
  createMenu: async (req, res) => {
    const result = await menuService.createMenu(
      req.user._id,
      req.body,
      req.file,
    );
    sendSuccessResponse(res, 201, 'Menu created successfully', result);
  },
  updateMenu: async (req, res) => {
    const result = await menuService.updateMenu(
      req.params.menuId,
      req.body,
      req.file,
    );
    sendSuccessResponse(res, 200, 'Menu updated successfully', result);
  },
  getMenusByAdmin: async (req, res) => {
    const adminId = req.effectiveAdminId ?? req.user?._id;
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    const filter = pick(req.query, [
      'adminId',
      'search',
      'category',
      'isActive',
      'inStock',
    ]);
    const result = await menuService.getMenusByAdmin(adminId, filter, options);
    sendSuccessResponse(res, 200, 'Admin menus fetched successfully', result);
  },
  getRecipeListByAdmin: async (req, res) => {
    const adminId = req.user.adminId ?? req.user._id;

    const filter = pick(req.query, ['search', 'isActive']);

    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);

    const result = await menuService.getRecipeListByAdmin(
      adminId,
      filter,
      options,
    );

    sendSuccessResponse(res, 200, 'Recipe list fetched successfully', result);
  },
  getRecipeByMenuId: async (req, res) => {
    const result = await menuService.getRecipeByMenuId(req.params.menuId);

    sendSuccessResponse(res, 200, 'Recipe fetched successfully', result);
  },
  getMenuById: async (req, res) => {
    const menuId = req.params.menuId;
    const result = await menuService.getMenuById(menuId);
    sendSuccessResponse(res, 200, 'Menu fetched successfully', result);
  },
  getPublicMenus: async (req, res) => {
    const { adminId } = req.params;
    const result = await menuService.getPublicMenus(adminId, req.query);
    sendSuccessResponse(res, 200, 'Public menu fetched successfully', result);
  },
};

export default menuController;
