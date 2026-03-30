import { pick } from '../../../utils/pick.js';
import { sendSuccessResponse } from '../../../utils/response.js';

import { orderService } from './service.js';

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
    const adminId = req.user._id;
    const filter = pick(req.query, [
      'isCompleted',
      'tableNumber',
      'paymentStatus',
      'search',
    ]);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    const result = await orderService.getOrders(adminId, filter, options);
    sendSuccessResponse(res, 200, 'Orders fetched', result);
  },
  getOrderById: async (req, res) => {
    const orderId = req.params.orderId;
    const result = await orderService.getOrderById(orderId, req.user._id);
    sendSuccessResponse(res, 200, 'Order details fetched', result);
  },
  getMyOrders: async (req, res) => {
    const filter = pick(req.query, ['userId']);
    const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
    const result = await orderService.getMyOrders(filter, options);
    sendSuccessResponse(res, 200, 'Orders fetched successfully', result);
  },
  updateIsCompletedStatus: async (req, res) => {
    const result = await orderService.updateIsCompletedStatus(
      req.body.orderId,
      req.body.isCompleted,
      req.user._id,
    );
    sendSuccessResponse(res, 200, 'Status updated', result);
  },
  updatePaymentStatus: async (req, res) => {
    const { orderId, paymentStatus } = req.body;
    const result = await orderService.updatePaymentStatus(
      orderId,
      paymentStatus,
      req.user._id,
    );
    sendSuccessResponse(res, 200, 'Payment status updated', result);
  },
  deleteOrder: async (req, res) => {
    const result = await orderService.deleteOrder(
      req.params.orderId,
      req.user._id,
    );
    sendSuccessResponse(res, 200, 'Order deleted', result);
  },
  getBillDetails: async (req, res) => {
    const result = await orderService.getOrderBillDetails(
      req.params.id,
      req.user._id,
    );

    sendSuccessResponse(res, 200, 'Bill details fetched', result);
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
