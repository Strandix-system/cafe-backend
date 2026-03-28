import { sendSuccessResponse } from '../../../utils/response.js';

import { orderItemService } from './orderItem.service.js';

export const orderItemController = {
  getItems: async (req, res) => {
    const result = await orderItemService.getOrderItems(
      req.params.orderId,
      req.user._id,
    );
    sendSuccessResponse(res, 200, 'Order items fetched', result);
  },

  updateItemStatus: async (req, res) => {
    const { orderItemId, status } = req.body;
    const result = await orderItemService.updateItemStatus(
      orderItemId,
      status,
      req.user._id,
    );
    sendSuccessResponse(res, 200, 'Item status updated', result);
  },

  updateQuantity: async (req, res) => {
    const { orderItemId, quantity, customerId, userId } = req.body;
    const role = req.user?.role;
    const result = await orderItemService.updateQuantity(
      orderItemId,
      quantity,
      {
        role,
        customerId: customerId ?? userId,
        _id: req.user?._id,
      },
    );
    sendSuccessResponse(res, 200, 'Item quantity updated', result);
  },

  deleteItem: async (req, res) => {
    const { customerId, userId } = req.body ?? {};
    const role = req.user?.role;
    const result = await orderItemService.deleteOrderItem(
      req.params.orderItemId,
      {
        role,
        customerId: customerId ?? userId,
        _id: req.user?._id,
      },
    );
    sendSuccessResponse(res, 200, 'Order item deleted', result);
  },
};
