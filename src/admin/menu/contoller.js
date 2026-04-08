import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';
import {
  resolveAdminOwnerId,
  resolveOutletAccessContext,
} from '../../../utils/adminAccess.js';

import { menuService } from './service.js';

export const menuController = {
  createMenu: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.body.outletId ?? req.query.outletId,
      {
        requireOutlet: req.user.role !== 'superadmin',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.body.adminId ?? req.query.adminId,
      },
    );
    const result = await menuService.createMenu(
      context.adminId,
      context.outletId,
      req.body,
      req.file,
    );
    sendSuccessResponse(res, 201, 'Menu created successfully', result);
  },
  updateMenu: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.body.outletId ?? req.query.outletId,
      { requireOutlet: req.user.role === 'manager' },
    );
    const result = await menuService.updateMenu(
      req.params.menuId,
      context.adminId,
      context.outletId,
      req.body,
      req.file,
    );
    sendSuccessResponse(res, 200, 'Menu updated successfully', result);
  },
  getAllMenus: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      {
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.query.adminId,
      },
    );
    const filter = pick(req.query, [
      'search',
      'category',
      'isActive',
      'inStock',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    const result = await menuService.getAllMenus(
      context.adminId,
      context.outletId,
      filter,
      options,
    );
    sendSuccessResponse(res, 200, 'menu fetched successfully', result);
  },
  getMenusByAdmin: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.query.adminId,
      },
    );
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    const filter = pick(req.query, [
      'search',
      'category',
      'isActive',
      'inStock',
    ]);
    const result = await menuService.getMenusByAdmin(
      context.adminId,
      context.outletId,
      filter,
      options,
    );
    sendSuccessResponse(res, 200, 'Admin menus fetched successfully', result);
  },
  getMenuById: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      { requireOutlet: req.user.role === 'manager' },
    );
    const menuId = req.params.menuId;
    const result = await menuService.getMenuById(
      menuId,
      context.adminId,
      context.outletId,
    );
    sendSuccessResponse(res, 200, 'Menu fetched successfully', result);
  },
  getPublicMenus: async (req, res) => {
    const { adminId } = req.params;
    const result = await menuService.getPublicMenus(adminId, req.query);
    sendSuccessResponse(res, 200, 'Public menu fetched successfully', result);
  },
};

export default menuController;
