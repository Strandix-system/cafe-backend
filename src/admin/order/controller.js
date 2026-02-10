import orderService from "./service.js";
import { pick } from "../../../utils/pick.js";
import { sendSuccessResponse } from "../../../utils/response.js";


const orderController = {
  createPublicOrder: async (req, res, next) => {
    try {

      const order = await orderService.createOrderByCustomerId(
        req.body.customerId,
        req.body
      );
      sendSuccessResponse(res, 201, "Order placed", order);
    } catch (err) {
      next(err);
    }
  },
  getOrders: async (req, res, next) => {
    try {

      const adminId = req.user.id;

      const options = pick(
        req.query,
        ["page", "limit", "sortBy", "populate"]
      );

      const filter = pick(
        req.query,
        ["orderStatus", "tableNumber", "paymentStatus"]
      );

      const result =
        await orderService.getOrders(
          adminId,
          filter,
          options
        );
      sendSuccessResponse(res, 200, "Orders fetched", result);
    } catch (err) {
      next(err);
    }
  },
  getMyOrders: async (req, res, next) => {
    try {

      const result =
        await orderService.getOrdersByCustomer(
          req.user._id,
          {},
          pick(req.query, ["page", "limit", "sortBy", "populate"])
        );
      sendSuccessResponse(res, 200, "My orders fetched", result);
    } catch (err) {
      next(err);
    }
  },
  updateStatus: async (req, res, next) => {
    try {

      const result =
        await orderService.updateStatus(
          req.params.id,
          req.body.status,
          req.user._id
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
};

export default orderController;
