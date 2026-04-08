import { pick } from '../../utils/pick.js';
import { sendSuccessResponse } from '../../utils/response.js';
import {
  resolveAdminOwnerId,
  resolveOutletAccessContext,
} from '../../utils/adminAccess.js';

import { portfolioService } from './service.js';

export const portfolioController = {
  aboutStats: async (req, res) => {
    const filter = pick(req.params, ['adminId']);
    const data = await portfolioService.aboutStats(filter);
    sendSuccessResponse(res, 200, 'About stats fetched', data);
  },
  createCustomerFeedback: async (req, res) => {
    const data = await portfolioService.createCustomerFeedback(req.body);
    sendSuccessResponse(res, 201, 'Customer feedback submitted', data);
  },
  getTopCustomerFeedbacks: async (req, res) => {
    const filter = pick(req.params, ['adminId']);
    const data = await portfolioService.getTopCustomerFeedbacks(filter);
    sendSuccessResponse(res, 200, 'Top customer feedback fetched', data);
  },
  updateFeedback: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.body.outletId ?? req.query.outletId,
      { requireOutlet: req.user.role === 'manager' },
    );
    const data = await portfolioService.updateFeedback(
      context.adminId,
      context.outletId,
      req.params.feedbackId,
      req.body,
    );
    sendSuccessResponse(res, 200, 'Portfolio feedback selection updated', data);
  },
  getCustomerFeedbacks: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      { requireOutlet: req.user.role === 'manager' },
    );
    const filter = pick(req.query, ['search']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    options.populate = 'customerId';
    filter.adminId = context.adminId;
    filter.outletId = context.outletId;
    const data = await portfolioService.getCustomerFeedbacks(filter, options);
    sendSuccessResponse(res, 200, 'Customer feedback fetched', data);
  },
  deleteCustomerFeedback: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.body?.outletId ?? req.query.outletId,
      { requireOutlet: req.user.role === 'manager' },
    );
    await portfolioService.deleteCustomerFeedback(
      req.params.id,
      context.adminId,
      context.outletId,
    );
    sendSuccessResponse(res, 200, 'Customer feedback deleted', undefined);
  },
  calculatePortfolioBill: async (req, res) => {
    const result = await portfolioService.calculatePortfolioBill(req.body);
    sendSuccessResponse(res, 200, 'Portfolio bill calculated', result);
  },
};
