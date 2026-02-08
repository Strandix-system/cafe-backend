import Order from "../../../model/order.js";
import UserOrder from "../../../model/userOrder.js";
import Menu from "../../../model/menu.js";

const orderService = {

  // CREATE ORDER
  createOrder: async (adminId, userId, body) => {

    const { tableNumber, items, specialInstruction } = body;

    if (!items || !items.length) {
      throw new Error("Order items are required");
    }

    // 1. Calculate total
    let total = 0;

    for (let item of items) {
      const menu = await Menu.findById(item.menuId);

      if (!menu) throw new Error("Menu not found");

      total += menu.price * item.quantity;
    }

    // 2. Create Order
    const order = await Order.create({
      adminId,
      userId,
      tableNumber,
      specialInstruction,
      totalAmount: total,
    });

    // 3. Create UserOrders (Items)
    const orderItems = items.map((item) => ({
      orderId: order._id,
      menuId: item.menuId,
      quantity: item.quantity,
    }));

    await UserOrder.insertMany(orderItems);

    return order;
  },

  // GET ALL ORDERS (ADMIN)
  getOrders: async (adminId) => {
    return await Order.find({ adminId })
      .sort({ createdAt: -1 });
  },

  // UPDATE STATUS
  updateStatus: async (id, status) => {
    return await Order.findByIdAndUpdate(
      id,
      { orderStatus: status },
      { new: true }
    );
  },

  // GET ORDER ITEMS
  getOrderItems: async (orderId) => {
    return await UserOrder.find({ orderId })
      .populate("menuId");
  },
};

export default orderService;