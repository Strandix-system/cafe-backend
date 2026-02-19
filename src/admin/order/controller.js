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
      const filter = pick(req.query, ["orderStatus", "tableNumber", "paymentStatus"]);
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
  updateStatus: async (req, res, next) => {
    try {

      const status = req.body.status ?? req.body.orderStatus;
      const result =
        await orderService.updateStatus(
          req.body.orderId,
          status,
          req.user._id,
        );
      sendSuccessResponse(res, 200, "Status updated", result);
    } catch (err) {
      next(err);
    }
  },
  getItems: async (req, res, next) => {
    try {

      const result =
        await orderService.getOrderItems(
          req.params.id,
          req.user._id
        );
      sendSuccessResponse(res, 200, "Order items fetched", result);
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
};

export default orderController;