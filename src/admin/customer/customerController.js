import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';
import { resolveOutletAccessContext } from '../../../utils/adminAccess.js';

import customerService from './customerServer.js';

const customerController = {
  createCustomer: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.body.outletId ?? req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.body.adminId ?? req.query.adminId,
      },
    );
    const customer = await customerService.createCustomer(req.body, context);
    sendSuccessResponse(res, 201, 'Customer created', customer);
  },
  getCustomers: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      {
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.query.adminId,
      },
    );
    const filter = pick(req.query, ['search', 'status']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    const customers = await customerService.getCustomers(
      filter,
      options,
      req.user,
      context,
    );
    sendSuccessResponse(res, 200, 'Customers fetched', customers);
  },
  getCustomerById: async (req, res) => {
    const customer = await customerService.getCustomerById(req.params.id);
    sendSuccessResponse(res, 200, 'Customer fetched', customer);
  },
  updateCustomer: async (req, res) => {
    const customer = await customerService.updateCustomer(
      req.params.id,
      req.body,
    );
    sendSuccessResponse(res, 200, 'Customer updated', customer);
  },
  deleteCustomer: async (req, res) => {
    const result = await customerService.deleteCustomer(req.params.id);
    sendSuccessResponse(res, 200, 'Customer deleted', result);
  },
};

export default customerController;
