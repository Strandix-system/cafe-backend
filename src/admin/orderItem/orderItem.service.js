import OrderItem from "../../../model/orderItem.js";
import Order from "../../../model/order.js";
import Qr from "../../../model/qr.js";
import { getIO } from "../../../socket.js";

const recalculateOrderTotals = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  const orderItems = await OrderItem.find({ orderId })
    .populate("menuId", "price discountPrice");

  const subTotal = orderItems.reduce((sum, item) => {
    const menu = item.menuId;
    const price = menu?.discountPrice && menu.discountPrice > 0
      ? menu.discountPrice
      : menu?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const gstPercent = order.gstPercent || 0;
  const gstAmount = (subTotal * gstPercent) / 100;

  order.subTotal = subTotal;
  order.gstAmount = gstAmount;
  order.totalAmount = Math.round(subTotal + gstAmount);
  await order.save();

  return order;
};

const orderItemService = {
  getOrderItems: async (orderId, adminId) => {
    const order = await Order.findOne({ _id: orderId, adminId });
    if (!order) {
      throw new Error("Order not found");
    }

    return await OrderItem.find({ orderId })
      .populate("menuId")
      .populate("customerId", "name email phoneNumber");
  },

  updateItemStatus: async (orderItemId, status, adminId) => {
    if (!orderItemId) {
      throw new Error("orderItemId is required");
    }
    if (!status) {
      throw new Error("Item status is required");
    }

    status = status.trim().toLowerCase();
    const allowed = ["pending", "preparing", "served"];
    if (!allowed.includes(status)) {
      throw new Error("Invalid item status");
    }

    const orderItem = await OrderItem.findById(orderItemId);
    if (!orderItem) {
      throw new Error("Order item not found");
    }

    const order = await Order.findOne({
      _id: orderItem.orderId,
      adminId,
    });
    if (!order) {
      throw new Error("Order not found");
    }

    orderItem.status = status;
    orderItem.servedAt = status === "served" ? new Date() : orderItem.servedAt;
    await orderItem.save();

    const updatedItem = await OrderItem.findById(orderItem._id)
      .populate("menuId")
      .populate("customerId", "name email phoneNumber");

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
    if (!orderItemId) {
      throw new Error("orderItemId is required");
    }
    if (!quantity || Number(quantity) < 1) {
      throw new Error("Quantity must be at least 1");
    }

    const orderItem = await OrderItem.findById(orderItemId);
    if (!orderItem) {
      throw new Error("Order item not found");
    }

    if (orderItem.status === "served") {
      throw new Error("Served items cannot be edited");
    }

    const role = user?.role || "customer";
    const order = await Order.findById(orderItem.orderId).select("adminId");
    if (!order) {
      throw new Error("Order not found");
    }
    if (role === "admin") {
      if (order.adminId.toString() !== user?._id?.toString()) {
        throw new Error("Unauthorized to edit this order");
      }
      if (!["pending", "preparing"].includes(orderItem.status)) {
        throw new Error("Item cannot be edited in this status");
      }
    } else {
      const customerId = user?.customerId || user?.userId || user?._id;
      if (!customerId) {
        throw new Error("customerId is required to edit items");
      }
      if (orderItem.customerId.toString() !== customerId.toString()) {
        throw new Error("You can only edit your own items");
      }
      if (orderItem.status !== "pending") {
        throw new Error("Only pending items can be edited");
      }
    }

    orderItem.quantity = Number(quantity);
    await orderItem.save();

    await recalculateOrderTotals(orderItem.orderId);

    return await OrderItem.findById(orderItem._id)
      .populate("menuId")
      .populate("customerId", "name email phoneNumber");
  },

  deleteOrderItem: async (orderItemId, user) => {
    if (!orderItemId) {
      throw new Error("orderItemId is required");
    }

    const orderItem = await OrderItem.findById(orderItemId);
    if (!orderItem) {
      throw new Error("Order item not found");
    }

    if (orderItem.status === "served") {
      throw new Error("Served items cannot be deleted");
    }

    const order = await Order.findById(orderItem.orderId)
      .select("adminId tableNumber isCompleted");
    if (!order) {
      throw new Error("Order not found");
    }

    const role = user?.role || "customer";
    if (role === "admin") {
      if (order.adminId.toString() !== user?._id?.toString()) {
        throw new Error("Unauthorized to delete this order item");
      }
      if (order.isCompleted) {
        throw new Error("Completed orders cannot be edited");
      }
      if (!["pending", "preparing"].includes(orderItem.status)) {
        throw new Error("Item cannot be deleted in this status");
      }
    } else {
      const customerId = user?.customerId || user?.userId || user?._id;
      if (!customerId) {
        throw new Error("customerId is required to delete items");
      }
      if (orderItem.customerId.toString() !== customerId.toString()) {
        throw new Error("You can only delete your own items");
      }
      if (orderItem.status !== "pending") {
        throw new Error("Only pending items can be deleted");
      }
    }

    const populatedItem = await OrderItem.findById(orderItem._id)
      .populate("menuId")
      .populate("customerId", "name email phoneNumber");

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
          orderItem: populatedItem || orderItem,
        });
      }
      if (orderItem.customerId) {
        io.to(`customer-${orderItem.customerId.toString()}`).emit(
          "orderItemDeleted",
          {
            orderId: orderItem.orderId,
            orderItem: populatedItem || orderItem,
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

export default orderItemService;
