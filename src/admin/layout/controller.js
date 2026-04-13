import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';

import layoutService from './service.js';

const cafeLayoutController = {
  createCafeLayout: async (req, res) => {
    if (typeof req.body.hours === 'string') {
      req.body.hours = JSON.parse(req.body.hours);
    }
    const result = await layoutService.createCafeLayout(
      req.user._id,
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
    const result = await layoutService.updateCafeLayout(
      req.params.id,
      req.body,
      req.files,
    );
    sendSuccessResponse(res, 200, 'Cafe layout updated successfully', result);
  },
  updateLayoutStatus: async (req, res) => {
    const result = await layoutService.updateLayoutStatus(req.body);
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
    const layout = await layoutService.getLayoutById(req.params.id);
    sendSuccessResponse(res, 200, 'Layout fetched by ID', layout);
  },
  getCafeLayoutByAdmin: async (req, res) => {
    const options = pick(req.query, ['page', 'limit', 'populate']);
    const filter = pick(req.query, ['adminId', 'search', 'defaultLayout']);
    if (filter.defaultLayout) {
      filter.defaultLayout = filter.defaultLayout === 'true';
    }
    if (req.user.role === 'admin' || req.user.role === 'outlet_manager') {
      filter.adminId = req.user._id;
    }
    const result = await layoutService.getCafeLayoutByAdmin(filter, options);
    sendSuccessResponse(res, 200, 'Cafe layouts fetched successfully', result);
  },
  deleteCafeLayout: async (req, res) => {
    await layoutService.deleteCafeLayout(req.params.id);
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
