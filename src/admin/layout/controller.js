import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';
import { resolveOutletAccessContext } from '../../../utils/adminAccess.js';

import layoutService from './service.js';

const cafeLayoutController = {
  createCafeLayout: async (req, res) => {
    if (typeof req.body.hours === 'string') {
      req.body.hours = JSON.parse(req.body.hours);
    }
    const context = await resolveOutletAccessContext(
      req.user,
      req.body.outletId ?? req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.body.adminId ?? req.query.adminId,
      },
    );
    const result = await layoutService.createCafeLayout(
      context.adminId,
      context.outletId,
      req.body,
      req.files,
      req.user.role,
    );
    sendSuccessResponse(res, 201, 'Cafe layout created successfully', result);
  },
  updateCafeLayout: async (req, res) => {
    if (typeof req.body.hours === 'string') {
      req.body.hours = JSON.parse(req.body.hours);
    }
    const context = await resolveOutletAccessContext(
      req.user,
      req.body.outletId ?? req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.body.adminId ?? req.query.adminId,
      },
    );
    const result = await layoutService.updateCafeLayout(
      req.params.id,
      context.adminId,
      context.outletId,
      req.body,
      req.files,
    );
    sendSuccessResponse(res, 200, 'Cafe layout updated successfully', result);
  },
  updateLayoutStatus: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.body.outletId ?? req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.body.adminId ?? req.query.adminId,
      },
    );
    const result = await layoutService.updateLayoutStatus(
      req.body,
      context.adminId,
      context.outletId,
    );
    sendSuccessResponse(
      res,
      200,
      'Cafe layout status updated successfully',
      result,
    );
  },
  getAllLayout: async (req, res) => {
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    const filter = {
      ...pick(req.query, ['adminId']),
      defaultLayout: true,
    };
    const layout = await layoutService.getAllLayout(filter, options);
    sendSuccessResponse(
      res,
      200,
      'Default layouts fetched successfully',
      layout,
    );
  },
  getLayoutById: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.query.adminId,
      },
    );
    const layout = await layoutService.getLayoutById(
      req.params.id,
      context.adminId,
      context.outletId,
    );
    sendSuccessResponse(res, 200, 'Layout fetched by ID', layout);
  },
  getCafeLayoutByAdmin: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.query.adminId,
      },
    );
    const options = pick(req.query, ['page', 'limit', 'populate']);
    const filter = pick(req.query, ['adminId', 'search', 'defaultLayout']);
    if (filter.defaultLayout) {
      filter.defaultLayout = filter.defaultLayout === 'true';
    }
    if (!filter.defaultLayout) {
      filter.adminId = context.adminId;
      if (context.outletId) {
        filter.outletId = context.outletId;
      }
    }
    const result = await layoutService.getCafeLayoutByAdmin(filter, options);
    sendSuccessResponse(res, 200, 'Cafe layouts fetched successfully', result);
  },
  deleteCafeLayout: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.body?.outletId ?? req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.body?.adminId ?? req.query.adminId,
      },
    );
    await layoutService.deleteCafeLayout(
      req.params.id,
      context.adminId,
      context.outletId,
    );
    sendSuccessResponse(res, 200, 'Cafe layout deleted successfully');
  },
  getActiveLayout: async (req, res) => {
    const { id } = req.params;
    const layout = await layoutService.getActiveLayout(id);
    sendSuccessResponse(
      res,
      200,
      'Layout fetched for portfolio successfully',
      layout,
    );
  },
};

export default cafeLayoutController;
