import { Staff } from '../../../model/staff.js';
import { ApiError } from '../../../utils/apiError.js';
import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';
import { hasValidStaffRole } from '../../../utils/utils.js';

import { orderService } from './service.js';

const getEffectiveAdminId = (user) =>
  hasValidStaffRole(user.role) ? user.adminId : user?._id;

const handleChangeTable = async (req, res, serviceFn) => {
  const { orderId, newTableNumber, qrId } = req.body;

  const result = await serviceFn(orderId, newTableNumber, req.user ?? qrId);

  sendSuccessResponse(res, 200, 'Table changed successfully', result);
};

export const orderController = {
  createPublicOrder: async (req, res) => {
    const order = await orderService.createOrderByCustomerId(req.body);
    sendSuccessResponse(res, 201, 'Order placed', order);
  },
  createOfflineOrder: async (req, res) => {
    const order = await orderService.createOfflineOrderByAdmin(
      req.body,
      req.user,
    );
    sendSuccessResponse(res, 201, 'Offline order created', order);
  },
  getOrders: async (req, res) => {
    const adminId = getEffectiveAdminId(req.user);
    const filter = pick(req.query, [
      'isCompleted',
      'tableNumber',
      'paymentStatus',
      'search',
      'orderType',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    const result = await orderService.getOrders(adminId, filter, options);
    sendSuccessResponse(res, 200, 'Orders fetched', result);
  },
  getOrderById: async (req, res) => {
    const orderId = req.params.orderId;
    const adminId = getEffectiveAdminId(req.user);
    const result = await orderService.getOrderById(orderId, adminId);
    sendSuccessResponse(res, 200, 'Order details fetched', result);
  },
  getMyOrders: async (req, res) => {
    const filter = pick(req.query, ['userId']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    const result = await orderService.getMyOrders(filter, options);
    sendSuccessResponse(res, 200, 'Orders fetched successfully', result);
  },
  getMyCreatedOrdersStats: async (req, res) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    const role = req.user.role;

    let staffId = null;
    let adminId = null;

    if (hasValidStaffRole(role)) {
      staffId = req.user._id;
      adminId = req.user.adminId;
    } else if (role === 'admin' || role === 'outlet_manager') {
      adminId = req.user._id;
      staffId = req.query.staffId;

      if (!staffId) {
        throw new ApiError(400, 'staffId query parameter is required');
      }

      const staffExists = await Staff.exists({ _id: staffId, adminId });
      if (!staffExists) {
        throw new ApiError(404, 'Staff not found');
      }
    } else {
      throw new ApiError(403, 'Access denied');
    }

    const filter = pick(req.query, [
      'isCompleted',
      'tableNumber',
      'paymentStatus',
      'search',
      'orderType',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);

    const result = await orderService.getStaffCreatedOrdersStats(
      staffId,
      adminId,
      filter,
      options,
    );

    sendSuccessResponse(res, 200, 'Staff order stats fetched', result);
  },
  updateIsCompletedStatus: async (req, res) => {
    const adminId = getEffectiveAdminId(req.user);
    const result = await orderService.updateIsCompletedStatus(
      req.body.orderId,
      req.body.isCompleted,
      adminId,
    );
    sendSuccessResponse(res, 200, 'Status updated', result);
  },
  updatePaymentStatus: async (req, res) => {
    const { orderId, paymentStatus } = req.body;
    const adminId = getEffectiveAdminId(req.user);
    const result = await orderService.updatePaymentStatus(
      orderId,
      paymentStatus,
      adminId,
    );
    sendSuccessResponse(res, 200, 'Payment status updated', result);
  },
  deleteOrder: async (req, res) => {
    const adminId = getEffectiveAdminId(req.user);
    const result = await orderService.deleteOrder(req.params.orderId, adminId);
    sendSuccessResponse(res, 200, 'Order deleted', result);
  },
  getBillDetails: async (req, res) => {
    const adminId = getEffectiveAdminId(req.user);
    const result = await orderService.getOrderBillDetails(
      req.params.id,
      adminId,
    );

    sendSuccessResponse(res, 200, 'Bill details fetched', result);
  },
  getTableStatusOverview: async (req, res) => {
    const adminId = getEffectiveAdminId(req.user);
    const result = await orderService.getTableStatusOverview(adminId);

    sendSuccessResponse(res, 200, 'Table status fetched', result);
  },
  getActiveOrderByQr: async (req, res) => {
    const result = await orderService.getActiveOrderByQr(
      req.params.qrId,
      req.query.customerId,
    );

    sendSuccessResponse(res, 200, 'Active order fetched', result);
  },

  changeTable: (req, res) =>
    handleChangeTable(req, res, orderService.changeTable),

  changeTablePublic: (req, res) =>
    handleChangeTable(req, res, orderService.changeTablePublic),
};
