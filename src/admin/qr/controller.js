import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';

import qrService from './service.js';

const qrController = {
  createQr: async (req, res) => {
    const { totalTables } = req.body;
    const result = await qrService.createQr(req.effectiveAdminId, totalTables);
    sendSuccessResponse(res, 201, 'QR codes created', result);
  },
  scanQr: async (req, res) => {
    const { qrId } = req.params;
    const result = await qrService.scanQr(qrId);
    sendSuccessResponse(res, 200, 'QR scanned', result);
  },
  getAllQr: async (req, res) => {
    const adminId = req.effectiveAdminId;
    const filter = { ...pick(req.query, ['search', 'tableNumber', 'adminId']) };
    const options = {
      ...pick(req.query, ['page', 'limit', 'populate']),
      sortBy: 'tableNumber:asc',
    };
    const result = await qrService.getAllQr(filter, options, adminId);
    sendSuccessResponse(res, 200, 'QR codes fetched', result);
  },
  getQrCountforLayout: async (req, res) => {
    const count = await qrService.getQrCountforLayout(req.effectiveAdminId);
    sendSuccessResponse(res, 200, 'QR count fetched', { count });
  },
};

export default qrController;
