import Order from "../../../model/order.js";
import Menu from "../../../model/menu.js";
import Customer from "../../../model/customer.js";
import User from "../../../model/user.js";
import { getIO } from "../../../socket.js";

const orderService = {
  createOrderByCustomerId: async (body) => {
    const { items, specialInstruction, customerId, tableNumber } = body;

    if (!items || !items.length) {
      throw new Error("Order items are required");
    }

    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error("Customer not found");
    }

    const adminId = customer.adminId;

    console.log("Admin ID for order:", adminId);
    const admin = await User.findOne({ _id: adminId, role: "admin" })
      .select("gst");


    if (!admin) {
      throw new Error("Admin not found");
    }

    const gstPercent = admin.gst;

    const menuIds = items.map(menu => menu.menuId);

    const menus = await Menu.find({
      _id: { $in: menuIds }
    });

    if (menus?.length !== items.length) {
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

    const populatedOrder = await Order.findById(order._id)
      .populate("adminId", "name email")
      .populate("userId", "name email phoneNumber")
      .populate("items.menuId");

    // Emit to all admin clients for that adminId
    io.to(adminId.toString()).emit("newOrder", populatedOrder); // legacy
    io.to(adminId.toString()).emit("order:new", populatedOrder); // preferred

    return order;
  },
  getOrders: async (adminId, filter, options) => {

    return await Order.paginate(
      { adminId, ...filter },
      options
    );
  },
  getOrdersByCustomer: async (filter, options) => {
    if (!filter.userId) {
      throw new Error("userId is required to fetch customer's orders");
    }
    const result = await Order.paginate(filter, options);
    return result;
  },
  updateStatus: async (body, adminId) => {
    try {
      const { orderId, status, paymentStatus } = body;
      const allowed = ["pending", "accepted", "completed"];
      
      if(status){
        status = status.trim().toLowerCase();
      }

      if (status && !allowed.includes(status)) {
        throw new Error("Invalid order status");
      }

      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, adminId },
        {
          ...(status && { orderStatus: status }),
          ...(paymentStatus && { paymentStatus })
        },    
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

      if (!updatedOrder.userId || !updatedOrder.userId._id) {
        console.error("Order missing userId, cannot emit to customer");
        return updatedOrder;
      }

      try {
        const io = getIO();
        const customerId = updatedOrder.userId._id.toString();

        // Emit to admin
        io.to(adminId.toString()).emit("orderStatusUpdate", { // legacy
          orderId: updatedOrder._id,
          status,
          order: updatedOrder,
          paymentStatus: updatedOrder.paymentStatus,
        });
        io.to(adminId.toString()).emit("order:statusUpdated", {
          orderId: updatedOrder._id,
          status,
          order: updatedOrder,
          paymentStatus: updatedOrder.paymentStatus,
        });

        // Emit to customer
        io.to(`customer-${customerId}`).emit("orderStatusUpdate", { // legacy
          orderId: updatedOrder._id,
          status: status,
          order: updatedOrder,
        });
        io.to(`customer-${customerId}`).emit("order:statusUpdated", {
          orderId: updatedOrder._id,
          status,
          order: updatedOrder,
        });

        // Keep legacy events for backward compatibility if needed
        if (status === "accepted") {
          io.to(adminId.toString()).emit("orderAccepted", {
            orderId: updatedOrder._id,
            order: updatedOrder,
          });
        }

        if (status === "completed") {
          io.to(adminId.toString()).emit("completeOrder", updatedOrder._id);
        }
      } catch (socketError) {
        console.error("Socket emission error:", socketError);
        // Don't throw - order was updated successfully
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
  getMyOrders: async (customerId, filter, options) => {
    if (!customerId) {
      throw new Error("Customer ID is required to fetch orders");
    }
    const result = await Order.paginate(
      { userId: customerId, ...filter },
      options
    );
    return result;
  },

};

export default orderService;