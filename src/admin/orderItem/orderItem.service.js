import { OrderItem } from "../../../model/orderItem.js";
import Order from "../../../model/order.js";
import Qr from "../../../model/qr.js";
import { getIO } from "../../../socket.js";
import { ApiError } from "../../../utils/apiError.js";
import { ORDER_STATUS } from "../../../utils/constants.js";
import { buildAggregatedItems } from "../../../utils/utils.js";  

const recalculateOrderTotals = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const orderItems = await OrderItem.find({ orderId })
    .populate("menuId", "price discountPrice");

  const subTotal = orderItems.reduce((sum, item) => {
    const menu = item.menuId;
    const price = menu?.discountPrice && menu.discountPrice > 0
      ? menu.discountPrice
      : menu?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const gstPercent = order.gstPercent ?? 0;
  const gstAmount = (subTotal * gstPercent) / 100;

  order.subTotal = subTotal;
  order.gstAmount = gstAmount;
  order.totalAmount = Math.round(subTotal + gstAmount);
  await order.save();

  return order;
};
const buildOrderWithItems = async (orderId) => {
  const order = await Order.findById(orderId).populate("adminId", "name email");
  if (!order) return null;

  const orderItems = await OrderItem.find({ orderId })
    .populate("menuId")
    .populate("customerId", "name phoneNumber");

  return {
    ...order.toObject(),
    items: buildAggregatedItems(orderItems),
    orderItems: orderItems.map((i) => i.toObject()),
  };
};

export const orderItemService = {
  getOrderItems: async (orderId, adminId) => {
    const order = await Order.findOne({ _id: orderId, adminId });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return await OrderItem.find({ orderId })
      .populate("menuId")
      .populate("customerId", "name email phoneNumber");
  },

  updateItemStatus: async (orderItemId, status, adminId) => {
    const orderItem = await OrderItem.findById(orderItemId);
    if (!orderItem) {
      throw new ApiError(404, "Order item not found");
    }

    const order = await Order.findOne({
      _id: orderItem.orderId,
      adminId,
    });
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    orderItem.status = status;
    orderItem.servedAt =
      status === ORDER_STATUS.SERVED ? new Date() : orderItem.servedAt;
    await orderItem.save();

    const updatedItem = await OrderItem.findById(orderItem._id)
      .populate("menuId")
      .populate("customerId", "name phoneNumber");

    try {
      const io = getIO();
      io.to(adminId.toString()).emit("orderItemStatusUpdate", {
        orderId: orderItem.orderId,
        orderItem: updatedItem,
        status,
      });
      if (orderItem.customerId) {
        io.to(`customer-${orderItem.customerId.toString()}`).emit(
          "orderItemStatusUpdate",
          {
            orderId: orderItem.orderId,
            orderItem: updatedItem,
            status,
          }
        );
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    return updatedItem;
  },

  updateQuantity: async (orderItemId, quantity, user) => {
    const orderItem = await OrderItem.findById(orderItemId);
    if (!orderItem) {
      throw new ApiError(404, "Order item not found");
    }
    if (orderItem.status === ORDER_STATUS.SERVED) {
      throw new ApiError(400, "Served items cannot be edited");
    }

    const role = user?.role ?? "customer";

    const order = await Order.findById(orderItem.orderId).select("adminId");
    if (!order) {
      throw new ApiError(404, "Order not found");
    }
    if (role === "admin") {
      if (order.adminId.toString() !== user?._id?.toString()) {
        throw new ApiError(403, "Unauthorized to edit this order");
      }
      if (![ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING].includes(orderItem.status)) {
        throw new ApiError(400, "Item cannot be edited in this status");
      }
    } else {
      const customerId = user?.customerId ?? user?.userId ?? user?._id;

      if (orderItem.customerId.toString() !== customerId.toString()) {
        throw new ApiError(403, "You can only edit your own items");
      }
      if (orderItem.status !== ORDER_STATUS.PENDING) {
        throw new ApiError(400, "Only pending items can be edited");
      }
    }

    orderItem.quantity = quantity;
    await orderItem.save();

    await recalculateOrderTotals(orderItem.orderId);

    const updatedItem = await OrderItem.findById(orderItem._id)
      .populate("menuId")
      .populate("customerId", "name phoneNumber");

    const orderWithItems = await buildOrderWithItems(orderItem.orderId);

    try {
      const io = getIO();
      if (order.adminId) {
        io.to(order.adminId.toString()).emit("orderItemQuantityUpdate", {
          orderId: orderItem.orderId,
          orderItem: updatedItem,
          quantity: updatedItem?.quantity,
          order: orderWithItems,
        });
        if (orderWithItems) {
          io.to(order.adminId.toString()).emit("order:updated", {
            orderId: orderItem.orderId,
            order: orderWithItems,
          });
        }
      }
      if (orderItem.customerId) {
        io.to(`customer-${orderItem.customerId.toString()}`).emit(
          "orderItemQuantityUpdate",
          {
            orderId: orderItem.orderId,
            orderItem: updatedItem,
            quantity: updatedItem?.quantity,
            order: orderWithItems,
          }
        );
        if (orderWithItems) {
          io.to(`customer-${orderItem.customerId.toString()}`).emit(
            "order:updated",
            {
              orderId: orderItem.orderId,
              order: orderWithItems,
            }
          );
        }
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    return updatedItem;
  },

  deleteOrderItem: async (orderItemId, user) => {
    const orderItem = await OrderItem.findById(orderItemId);
    if (!orderItem) {
      throw new ApiError(400, "Order item not found");
    }

    if (orderItem.status === ORDER_STATUS.SERVED) {
      throw new ApiError(400, "Served items cannot be deleted");
    }

    const order = await Order.findById(orderItem.orderId)
      .select("adminId tableNumber isCompleted");
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const role = user?.role ?? "customer";
    if (role === "admin") {
      if (order.adminId.toString() !== user?._id?.toString()) {
        throw new ApiError(403, "Unauthorized to delete this order item");
      }
      if (order.isCompleted) {
        throw new ApiError(400, "Completed orders cannot be edited");
      }
      if (![ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING].includes(orderItem.status)) {
        throw new ApiError(400, "Item cannot be deleted in this status");
      }
    } else {
      const customerId = user?.customerId ?? user?.userId ?? user?._id;
      if (orderItem.customerId.toString() !== customerId.toString()) {
        throw new ApiError(403, "You can only delete your own items");
      }
      if (orderItem.status !== ORDER_STATUS.PENDING) {
        throw new ApiError(400, "Only pending items can be deleted");
      }
    }

    const populatedItem = await OrderItem.findById(orderItem._id)
      .populate("menuId")
      .populate("customerId", "name phoneNumber");

    await OrderItem.deleteOne({ _id: orderItem._id });
    await recalculateOrderTotals(orderItem.orderId);

    const remaining = await OrderItem.countDocuments({
      orderId: orderItem.orderId,
    });

    const autoDeletedOrder = remaining === 0;
    if (autoDeletedOrder) {
      await Order.deleteOne({ _id: orderItem.orderId });
      if (order.adminId && order.tableNumber !== undefined) {
        await Qr.findOneAndUpdate(
          { adminId: order.adminId, tableNumber: order.tableNumber },
          { occupied: false }
        );
      }
    }

    try {
      const io = getIO();
      if (order.adminId) {
        io.to(order.adminId.toString()).emit("orderItemDeleted", {
          orderId: orderItem.orderId,
          orderItem: populatedItem ?? orderItem,
        });
      }
      if (orderItem.customerId) {
        io.to(`customer-${orderItem.customerId.toString()}`).emit(
          "orderItemDeleted",
          {
            orderId: orderItem.orderId,
            orderItem: populatedItem ?? orderItem,
          }
        );
      }
      if (autoDeletedOrder) {
        if (order.adminId) {
          io.to(order.adminId.toString()).emit("orderDeleted", {
            orderId: orderItem.orderId,
          });
        }
        if (orderItem.customerId) {
          io.to(`customer-${orderItem.customerId.toString()}`).emit(
            "orderDeleted",
            { orderId: orderItem.orderId }
          );
        }
      }
    } catch (socketError) {
      console.error("Socket emission error:", socketError);
    }

    return { orderItem, autoDeletedOrder };
  },
};