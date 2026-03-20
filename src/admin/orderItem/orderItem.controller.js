import orderItemService from "./orderItem.service.js";
import { sendSuccessResponse } from "../../../utils/response.js";

const orderItemController = {
  getItems: async (req, res, next) => {
    try {
      const result = await orderItemService.getOrderItems(
        req.params.orderId,
        req.user._id
      );
      sendSuccessResponse(res, 200, "Order items fetched", result);
    } catch (err) {
      next(err);
    }
  },

  updateItemStatus: async (req, res, next) => {
    try {
      const { orderItemId, status } = req.body;
      const result = await orderItemService.updateItemStatus(
        orderItemId,
        status,
        req.user._id
      );
      sendSuccessResponse(res, 200, "Item status updated", result);
    } catch (err) {
      next(err);
    }
  },

  updateQuantity: async (req, res, next) => {
    try {
      const { orderItemId, quantity, customerId, userId } = req.body;
      const role = req.user?.role;
      const result = await orderItemService.updateQuantity(
        orderItemId,
        quantity,
        {
          role,
          customerId: customerId || userId,
          _id: req.user?._id,
        }
      );
      sendSuccessResponse(res, 200, "Item quantity updated", result);
    } catch (err) {
      next(err);
    }
  },

  deleteItem: async (req, res, next) => {
    try {
      const { customerId, userId } = req.body || {};
      const role = req.user?.role;
      const result = await orderItemService.deleteOrderItem(
        req.params.orderItemId,
        {
          role,
          customerId: customerId || userId,
          _id: req.user?._id,
        }
      );
      sendSuccessResponse(res, 200, "Order item deleted", result);
    } catch (err) {
      next(err);
    }
  },
};

export default orderItemController;
