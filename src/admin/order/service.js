import Order from "../../../model/order.js";
import Menu from "../../../model/menu.js";
import Customer from "../../../model/customer.js";
import User from "../../../model/user.js";
import { getIO } from "../../../socket.js";
import sendWhatsAppMessage from "../../../utils/whatsapp.js";

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

      const price = menu.discountPrice && menu.discountPrice > 0
        ? menu.discountPrice
        : menu.price;


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
      subTotal
    });

    const io = getIO();

    const populatedOrder = await Order.findById(order._id)
      .populate("adminId", "name email")
      .populate("userId", "name email phoneNumber")
      .populate("items.menuId");

    io.to(adminId.toString()).emit("newOrder", populatedOrder);
    io.to(adminId.toString()).emit("order:new", populatedOrder);
    io.to(`customer-${customer._id}`).emit("order:new", populatedOrder);

    return order;
  },
  getOrders: async (adminId, filter, options) => {
    return await Order.paginate({ adminId, ...filter }, options
    );
  },
  getMyOrders: async (filter, options) => {
    if (!filter.userId) {
      throw new Error("userId is required to fetch customer's orders");
    }
    const result = await Order.paginate(
      filter,
      options
    );

    return result;
  },
  updateStatus: async (orderId, status, adminId) => {
    try {
      if (!status) {
        throw new Error("Order status is required");
      }
      status = status.trim().toLowerCase();

      const allowed = ["pending", "accepted", "completed"];

      if (!allowed.includes(status)) {
        throw new Error("Invalid order status");
      }

      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, adminId },
        { orderStatus: status },
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

        io.to(adminId.toString()).emit("orderStatusUpdate", {
          orderId: updatedOrder._id,
          status: status,
          order: updatedOrder,
        });
        io.to(adminId.toString()).emit("order:statusUpdated", {
          orderId: updatedOrder._id,
          status,
          order: updatedOrder,
        });

        io.to(`customer-${customerId}`).emit("orderStatusUpdate", {
          orderId: updatedOrder._id,
          status: status,
          order: updatedOrder,
        });
        io.to(`customer-${customerId}`).emit("order:statusUpdated", {
          orderId: updatedOrder._id,
          status,
          order: updatedOrder,
        });

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
  updatePaymentStatus: async (orderId, paymentStatus, adminId) => {
    try {

      if (typeof paymentStatus !== "boolean") {
        throw new Error("Payment status must be true or false");
      }
      const order = await Order.findOne({ _id: orderId, adminId });
      if (!order) {
        throw new Error("Order not found");
      }
      if (order.orderStatus !== "completed") {
        throw new Error(
          "Payment status can only be updated when order is completed"
        );
      }
      if (order.paymentStatus === paymentStatus) {
        throw new Error("Payment status already updated");
      }
      order.paymentStatus = paymentStatus;
      await order.save();
      if (paymentStatus === true) {
        const billDetails = await orderService.getOrderBillDetails(
          orderId,
          adminId
        );
        try {
          const populatedOrder = await Order.findById(orderId)
            .populate("userId", "name phoneNumber")
            .populate("adminId", "cafeName");

          const customer = populatedOrder.userId;

          if (customer?.phoneNumber) {

            const formattedPhone = `91${customer.phoneNumber}`;

            const message = `
Hello ${customer.name},

✅ Payment received successfully.

🧾 Order Summary:
Table No: ${billDetails.tableNumber}
Total Amount: ₹${billDetails.total}

Your bill PDF is ready in the app.

Thank you for visiting ${populatedOrder.adminId.cafeName} ☕
See you again!
          `;

            await sendWhatsAppMessage({
              to: formattedPhone,
              message,
            });
          }

        } catch (whatsappError) {
          console.error("WhatsApp Error:", whatsappError.message);
        }
      }

      return order;

    } catch (error) {
      throw new Error(`Error updating payment status: ${error.message}`);
    }
  },
  getOrderBillDetails: async (orderId, adminId) => {
    const order = await Order.findOne({
      _id: orderId,
      adminId,
    })
      .populate("adminId", "cafeName gst address city state pincode")
      .populate("userId", "name");

    if (!order) {
      throw new Error("Order not found");
    }
    const subTotal = order.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const gstPercent = order.adminId.gst;
    const gstAmount = (subTotal * gstPercent) / 100;

    const total = Math.round(subTotal + gstAmount);

    return {
      cafeName: order.adminId.cafeName,
      address: `${order.adminId.address || ""}, ${order.adminId.city || ""}`,
      tableNumber: order.tableNumber,

      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        amount: item.price * item.quantity,
      })),

      subTotal,
      gstPercent,
      gstAmount,
      total,
      createdAt: order.createdAt,
    };
  },
};

export default orderService;
