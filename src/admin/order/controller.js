import {orderService} from "./service.js";
import { pick } from "../../../utils/pick.js";
import { sendSuccessResponse } from "../../../utils/response.js";

export const orderController = {
  createPublicOrder: async (req, res) => {
    const order = await orderService.createOrderByCustomerId(
      req.body
    );
    sendSuccessResponse(res, 201, "Order placed", order);
  },
  getOrders: async (req, res) => {
    const adminId = req.user._id;
    const filter = pick(req.query, ["isCompleted", "tableNumber", "paymentStatus"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
    const result = await orderService.getOrders(adminId, filter, options);
    sendSuccessResponse(res, 200, "Orders fetched", result);
  },
  getMyOrders: async (req, res) => {
    const filter = pick(req.query, ["userId"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
    const result = await orderService.getMyOrders(filter, options);
    sendSuccessResponse(res, 200, "Orders fetched successfully", result);
  },
  updateIsCompletedStatus: async (req, res) => {
   
    const result =
      await orderService.updateIsCompletedStatus(
        req.body.orderId,
        req.body.isCompleted,
        req.user._id,
      );
    sendSuccessResponse(res, 200, "Status updated", result);
  },
  updatePaymentStatus: async (req, res) => {
    const { orderId, paymentStatus } = req.body;
    const result = await orderService.updatePaymentStatus(
      orderId,
      paymentStatus,
      req.user._id
    );
    sendSuccessResponse(res, 200, "Payment status updated", result);
  },
  deleteOrder: async (req, res) => {
    const result = await orderService.deleteOrder(
      req.params.orderId,
      req.user._id
    );
    sendSuccessResponse(res, 200, "Order deleted", result);
  },
  getBillDetails: async (req, res) => {
    const result = await orderService.getOrderBillDetails(
      req.params.id,
      req.user._id
    );

    sendSuccessResponse(res, 200, "Bill details fetched", result);
  },
  getActiveOrderByQr: async (req, res) => {
    const result = await orderService.getActiveOrderByQr(
      req.params.qrId
    );
    sendSuccessResponse(res, 200, "Active order fetched", result);
  },
};
