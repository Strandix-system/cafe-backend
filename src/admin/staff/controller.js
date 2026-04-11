import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';

import { staffService } from './service.js';

export const staffController = {
  createStaff: async (req, res) => {
    const result = await staffService.createStaff(req.body, req.user, req.file);
    sendSuccessResponse(res, 201, 'Staff created', result);
  },

  listStaff: async (req, res) => {
    const filter = pick(req.query, ['role', 'isActive', 'search']);
    const options = pick(req.query, ['page', 'limit', 'sortBy']);
    const result = await staffService.listStaff(
      req.query.adminId,
      filter,
      options,
    );
    sendSuccessResponse(res, 200, 'Staff fetched', result);
  },

  updateStaff: async (req, res) => {
    const result = await staffService.updateStaff(
      req.params.id,
      req.body,
      req.file,
      req.user,
    );
    sendSuccessResponse(res, 200, 'Staff updated', result);
  },
};
