import { menuService } from './service.js';
import { sendSuccessResponse } from '../../../utils/response.js';
import { pick } from '../../../utils/pick.js';

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
  getAllMenus: async (req, res) => {
    const filter = pick(req.query, [
      'adminId',
      'search',
      'category',
      'isActive',
      'inStock',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    const result = await menuService.getAllMenus(filter, options, req.user._id);
    sendSuccessResponse(res, 200, 'menu fetched successfully', result);
  },
  getMenusByAdmin: async (req, res) => {
    const adminId = req.user._id;
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
