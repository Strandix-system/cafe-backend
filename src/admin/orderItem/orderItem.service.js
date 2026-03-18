import OrderItem from "../../../model/orderItem.js";
import Order from "../../../model/order.js";

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

const syncOrderCompletion = async (orderId) => {
  const remaining = await OrderItem.countDocuments({
    orderId,
    status: { $ne: "served" },
  });

  await Order.findByIdAndUpdate(orderId, {
    isCompleted: remaining === 0,
  });
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

    await syncOrderCompletion(orderItem.orderId);

    return await OrderItem.findById(orderItem._id)
      .populate("menuId")
      .populate("customerId", "name email phoneNumber");
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
};

export default orderItemService;
