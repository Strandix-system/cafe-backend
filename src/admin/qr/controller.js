import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';
import { resolveOutletAccessContext } from '../../../utils/adminAccess.js';

import qrService from './service.js';

const qrController = {
  createQr: async (req, res) => {
    const { totalTables } = req.body;
    const context = await resolveOutletAccessContext(
      req.user,
      req.body.outletId ?? req.query.outletId,
      {
        requireOutlet: true,
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.body.adminId ?? req.query.adminId,
      },
    );
    const result = await qrService.createQr(
      context.adminId,
      context.outletId,
      totalTables,
    );
    sendSuccessResponse(res, 201, 'QR codes created', result);
  },
  scanQr: async (req, res) => {
    const { qrId } = req.params;
    const result = await qrService.scanQr(qrId);
    sendSuccessResponse(res, 200, 'QR scanned', result);
  },
  getAllQr: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.query.adminId,
      },
    );
    const filter = { ...pick(req.query, ['search', 'tableNumber', 'adminId']) };
    const options = {
      ...pick(req.query, ['page', 'limit', 'populate']),
      sortBy: 'tableNumber:asc',
    };
    const result = await qrService.getAllQr(filter, options, context);
    sendSuccessResponse(res, 200, 'QR codes fetched', result);
  },
  getQrCountforLayout: async (req, res) => {
    const context = await resolveOutletAccessContext(
      req.user,
      req.query.outletId,
      {
        requireOutlet: req.user.role === 'manager',
        allowSuperadmin: req.user.role === 'superadmin',
        requestedAdminId: req.query.adminId,
      },
    );
    const count = await qrService.getQrCountforLayout(
      context.adminId,
      context.outletId,
    );
    sendSuccessResponse(res, 200, 'QR count fetched', { count });
  },
};

export default qrController;
