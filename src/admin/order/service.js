import Order from "../../../model/order.js";
import Menu from "../../../model/menu.js";
import Customer from "../../../model/customer.js";
import User from "../../../model/user.js";
import { getIO } from "../../../socket.js";

const orderService = {

  createOrderByCustomerId: async (customerId, body) => {

    const { items, specialInstruction } = body;

    if (!items || !items.length) {
      throw new Error("Order items are required");
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error("Customer not found");
    }

    const adminId = customer.adminId;
    const tableNumber = customer.tableNumber;

    const admin = await User.findById(adminId)
      .select("gst");

    if (!admin) {
      throw new Error("Admin not found");
    }

    const gstPercent = admin.gst || 0;

    const menuIds = items.map(i => i.menuId);

    const menus = await Menu.find({
      _id: { $in: menuIds }
    });

    if (menus.length !== items.length) {
      throw new Error("Invalid menu item");
    }
    let subTotal = 0;

    const finalItems = items.map(item => {

      const menu = menus.find(
        m => m._id.toString() === item.menuId
      );

      const price = menu.price;

      subTotal += price * item.quantity;

      return {
        menuId: item.menuId,
        name: menu.name,
        price,
        quantity: item.quantity,
      };
    });
    const gstAmount = (subTotal * gstPercent) / 100;

    const finalTotal = subTotal + gstAmount;

    const order = await Order.create({

      adminId,
      userId: customerId,
      tableNumber,
      items: finalItems,
      specialInstruction,
      totalAmount: Math.round(finalTotal),
      gstPercent,
      gstAmount,
    });

    const io = getIO();

    io.to(adminId.toString()).emit("newOrder", order);

    return order;
  },
  getOrders: async (adminId, filter, options) => {

    return await Order.paginate(
      { adminId, ...filter },
      options
    );
  },
  getOrdersByCustomer: async (userId, filter, options) => {

    return await Order.paginate(
      { userId, ...filter },
      options
    );
  },
 updateStatus: async (id, status, adminId) => {

  try {

    // Normalize status
    status = status.trim().toLowerCase();

    const allowed = ["pending", "accepted", "completed"];

    if (!allowed.includes(status)) {
      throw new Error("Invalid order status");
    }


    // Update + Populate
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: id, adminId },                // ✅ Secure by admin
      { orderStatus: status },            // ✅ Update
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("adminId", "name email")
      .populate("userId", "name email phoneNumber")
      .populate("items.menuId");


    if (!updatedOrder) {
      throw new Error("Order not found");
    }
    // Socket
    const io = getIO();
    // When accepted
    if (status === "accepted") {

      io.to(adminId.toString()).emit("orderAccepted", {
        orderId: updatedOrder._id,
        order: updatedOrder,
      });
    }
    // When completed
    if (status === "completed") {

      io.to(adminId.toString()).emit(
        "completeOrder",
        updatedOrder._id
      );
    }
    return updatedOrder;

  } catch (error) {

    throw new Error(`Error updating order: ${error.message}`);
  }
},

  getOrderItems: async (orderId, adminId) => {

    const order = await Order.findOne({
      _id: orderId,
      adminId,
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return await Order.find({ orderId })
      .populate("menuId");
  },
};

export default orderService;
