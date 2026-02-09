import orderService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";

const orderController = {

  // CREATE
  createOrder: async (req, res, next) => {
    try {
      const order = await orderService.createOrder(
        req.user._id,       // admin
        req.body.userId,    // customer
        req.body
      );

      sendSuccessResponse(res, 201, "Order placed", order);
    } catch (err) {
      next(err);
    }
  },

  // GET ALL
  getOrders: async (req, res, next) => {
    try {
      const result = await orderService.getOrders(req.user._id);

      sendSuccessResponse(res, 200, "Orders fetched", result);
    } catch (err) {
      next(err);
    }
  },

  // UPDATE STATUS
  updateStatus: async (req, res, next) => {
    try {
      const result = await orderService.updateStatus(
        req.params.id,
        req.body.status
      );

      sendSuccessResponse(res, 200, "Status updated", result);
    } catch (err) {
      next(err);
    }
  },

  // GET ITEMS
  getItems: async (req, res, next) => {
    try {
      const result = await orderService.getOrderItems(req.params.id);

      sendSuccessResponse(res, 200, "Order items", result);
    } catch (err) {
      next(err);
    }
  },
};

export default orderController;