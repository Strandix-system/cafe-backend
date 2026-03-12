import orderService from "./service.js";
import { pick } from "../../../utils/pick.js";
import { sendSuccessResponse } from "../../../utils/response.js";

const orderController = {
  createPublicOrder: async (req, res) => {
    const order = await orderService.createOrderByCustomerId(req.body);
    sendSuccessResponse(res, 201, "Order placed", order);
  },
  getOrders: async (req, res) => {
    const adminId = req.user._id;
    const filter = pick(req.query, ["orderStatus", "tableNumber", "paymentStatus"]);
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
  updateStatus: async (req, res) => {
    const status = req.body.status ?? req.body.orderStatus;
    const result = await orderService.updateStatus(
      req.body.orderId,
      status,
      req.user._id,
    );
    sendSuccessResponse(res, 200, "Status updated", result);
  },
  getItems: async (req, res) => {
    const result = await orderService.getOrderItems(
      req.params.id,
      req.user._id
    );
    sendSuccessResponse(res, 200, "Order items fetched", result);
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
  getBillDetails: async (req, res) => {
    const result = await orderService.getOrderBillDetails(
      req.params.id,
      req.user._id
    );
    sendSuccessResponse(res, 200, "Bill details fetched", result);
  },
};

export default orderController;
