import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';

import { outletService } from './service.js';

export const outletController = {
  createOutletManager: async (req, res) => {
    const outletManager = await outletService.createOutletManager(
      req.user,
      req.body,
      req.files,
    );
    sendSuccessResponse(
      res,
      201,
      'Outlet manager created successfully',
      outletManager,
    );
  },

  listOutlets: async (req, res) => {
    const filter = pick(req.query, ['search']);
    const options = pick(req.query, ['page', 'limit', 'sortBy']);
    const result = await outletService.listOutlets(
      req.user._id,
      filter,
      options,
    );
    sendSuccessResponse(res, 200, 'Outlets fetched successfully', result);
  },

  updateOutletManager: async (req, res) => {
    const outletManager = await outletService.updateOutletManager(
      req.user,
      req.params.outletId,
      req.body,
      req.files,
    );
    sendSuccessResponse(
      res,
      200,
      'Outlet manager updated successfully',
      outletManager,
    );
  },

  deleteOutletManager: async (req, res) => {
    await outletService.deleteOutletManager(req.user, req.params.outletId);
    sendSuccessResponse(res, 200, 'Outlet deleted successfully', null);
  },
};
