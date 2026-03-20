import orderService from "./service.js";
import { pick } from "../../../utils/pick.js";
import { sendSuccessResponse } from "../../../utils/response.js";

const orderController = {
  createPublicOrder: async (req, res, next) => {
    try {

      const order = await orderService.createOrderByCustomerId(
        req.body
      );
      sendSuccessResponse(res, 201, "Order placed", order);
    } catch (err) {
      next(err);
    }
  },
  getOrders: async (req, res, next) => {
    try {
      const adminId = req.user._id;
      const filter = pick(req.query, ["isCompleted", "tableNumber", "paymentStatus"]);
      const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
      const result = await orderService.getOrders(adminId, filter, options);
      sendSuccessResponse(res, 200, "Orders fetched", result);
    } catch (err) {
      next(err);
    }
  },
  getMyOrders: async (req, res, next) => {
    try {
      const filter = pick(req.query, ["userId"]);
      const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
      const result = await orderService.getMyOrders(filter, options);
      sendSuccessResponse(res, 200, "Orders fetched successfully", result);
    } catch (err) {
      next(err);
    }
  },
  updateIsCompletedStatus: async (req, res, next) => {
    try {

      const isCompleted = req.body.isCompleted;
      const result =
        await orderService.updateIsCompletedStatus(
          req.body.orderId,
          isCompleted,
          req.user._id,
        );
      sendSuccessResponse(res, 200, "Status updated", result);
    } catch (err) {
      next(err);
    }
  },
  updatePaymentStatus: async (req, res, next) => {
    try {
      const { orderId, paymentStatus } = req.body;
      const result = await orderService.updatePaymentStatus(
        orderId,
        paymentStatus,
        req.user._id
      );
      sendSuccessResponse(res, 200, "Payment status updated", result);
    } catch (err) {
      next(err);
    }
  },
  deleteOrder: async (req, res, next) => {
    try {
      const result = await orderService.deleteOrder(
        req.params.orderId,
        req.user._id
      );
      sendSuccessResponse(res, 200, "Order deleted", result);
    } catch (err) {
      next(err);
    }
  },
  getBillDetails: async (req, res, next) => {
    try {
      const result = await orderService.getOrderBillDetails(
        req.params.id,
        req.user._id
      );

      sendSuccessResponse(res, 200, "Bill details fetched", result);
    } catch (err) {
      next(err);
    }
  },
  getActiveOrderByQr: async (req, res, next) => {
    try {
      const result = await orderService.getActiveOrderByQr(
        req.params.qrId
      );
      sendSuccessResponse(res, 200, "Active order fetched", result);
    } catch (err) {
      next(err);
    }
  },
};

export default orderController;
