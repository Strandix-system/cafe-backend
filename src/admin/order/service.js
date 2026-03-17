import Order from "../../../model/order.js";
import Menu from "../../../model/menu.js";
import Customer from "../../../model/customer.js";
import User from "../../../model/user.js";
import Qr from "../../../model/qr.js";
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
        customerId: item.customerId || customerId,
        menuId: item.menuId,
        name: menu.name,
        price,
        quantity: item.quantity,
      };
    });

    if (finalItems.some(item => !item.customerId)) {
      throw new Error("customerId is required for each item");
    }

    const gstAmount = (subTotal * gstPercent) / 100;

    const finalTotal = subTotal + gstAmount;

    const qr = await Qr.findOne({ adminId, tableNumber });
    if (!qr) {
      throw new Error("Table not found");
    }

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const latestActiveOrder = await Order.findOne({
      adminId,
      tableNumber,
      orderStatus: { $ne: "completed" },
    }).sort({ createdAt: -1 });

    let order = null;

    const isWithinThreeHours =
      latestActiveOrder &&
      latestActiveOrder.createdAt &&
      latestActiveOrder.createdAt >= threeHoursAgo;

    if (qr.occupied && latestActiveOrder) {
      latestActiveOrder.items = (latestActiveOrder.items || []).map((item) => {
        const plainItem = item?.toObject ? item.toObject() : item;
        return {
          ...plainItem,
          customerId: plainItem.customerId || latestActiveOrder.userId,
        };
      });
      latestActiveOrder.items = [...latestActiveOrder.items, ...finalItems];
      if (specialInstruction) {
        latestActiveOrder.specialInstruction = latestActiveOrder.specialInstruction
          ? `${latestActiveOrder.specialInstruction}\n${specialInstruction}`
          : specialInstruction;
      }
      latestActiveOrder.subTotal = (latestActiveOrder.subTotal || 0) + subTotal;
      latestActiveOrder.gstPercent = gstPercent;
      latestActiveOrder.gstAmount =
        (latestActiveOrder.subTotal * gstPercent) / 100;
      latestActiveOrder.totalAmount = Math.round(
        latestActiveOrder.subTotal + latestActiveOrder.gstAmount
      );
      latestActiveOrder.customers = latestActiveOrder.customers || [];
      if (!latestActiveOrder.customers.find(id => id.toString() === customerId)) {
        latestActiveOrder.customers.push(customerId);
      }
      order = await latestActiveOrder.save();
    } else if (latestActiveOrder && isWithinThreeHours) {
      latestActiveOrder.items = (latestActiveOrder.items || []).map((item) => {
        const plainItem = item?.toObject ? item.toObject() : item;
        return {
          ...plainItem,
          customerId: plainItem.customerId || latestActiveOrder.userId,
        };
      });
      latestActiveOrder.items = [...latestActiveOrder.items, ...finalItems];
      if (specialInstruction) {
        latestActiveOrder.specialInstruction = latestActiveOrder.specialInstruction
          ? `${latestActiveOrder.specialInstruction}\n${specialInstruction}`
          : specialInstruction;
      }
      latestActiveOrder.subTotal = (latestActiveOrder.subTotal || 0) + subTotal;
      latestActiveOrder.gstPercent = gstPercent;
      latestActiveOrder.gstAmount =
        (latestActiveOrder.subTotal * gstPercent) / 100;
      latestActiveOrder.totalAmount = Math.round(
        latestActiveOrder.subTotal + latestActiveOrder.gstAmount
      );
      latestActiveOrder.customers = latestActiveOrder.customers || [];
      if (!latestActiveOrder.customers.find(id => id.toString() === customerId)) {
        latestActiveOrder.customers.push(customerId);
      }
      order = await latestActiveOrder.save();
      if (!qr.occupied) {
        qr.occupied = true;
        await qr.save();
      }
    } else {
      if (qr.occupied && !latestActiveOrder) {
        qr.occupied = false;
        await qr.save();
      }
      order = await Order.create({
        adminId,
        userId: customerId,
        customers: [customerId],
        tableNumber,
        items: finalItems,
        specialInstruction,
        totalAmount: Math.round(finalTotal),
        gstPercent,
        gstAmount,
        subTotal
      });

      qr.occupied = true;
      await qr.save();
    }

    const io = getIO();

    const populatedOrder = await Order.findById(order._id)
      .populate("adminId", "name email")
      .populate("userId", "name email phoneNumber")
      .populate("customers", "name email phoneNumber")
      .populate("items.customerId", "name email phoneNumber")
      .populate("items.menuId");

    io.to(adminId.toString()).emit("newOrder", populatedOrder);
    io.to(adminId.toString()).emit("order:new", populatedOrder);
    io.to(`customer-${customer._id}`).emit("order:new", populatedOrder);
    if (populatedOrder.customers?.length) {
      for (const custId of populatedOrder.customers) {
        const id = custId._id ? custId._id.toString() : custId.toString();
        if (id === customer._id.toString()) continue;
        io.to(`customer-${id}`).emit("order:new", populatedOrder);
      }
    }

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
    const userId = filter.userId;
    delete filter.userId;
    filter.$or = [
      { userId },
      { customers: userId },
    ];
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
      if (status === "accepted") {
        status = "preparing";
      }

      const allowed = ["pending", "preparing", "served", "completed"];

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
        .populate("customers", "name email phoneNumber")
        .populate("items.customerId", "name email phoneNumber")
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

        if (updatedOrder.customers?.length) {
          for (const custId of updatedOrder.customers) {
            const id = custId.toString();
            if (id === customerId) continue;
            io.to(`customer-${id}`).emit("orderStatusUpdate", {
              orderId: updatedOrder._id,
              status: status,
              order: updatedOrder,
            });
            io.to(`customer-${id}`).emit("order:statusUpdated", {
              orderId: updatedOrder._id,
              status,
              order: updatedOrder,
            });
          }
        }

        if (status === "preparing") {
          io.to(adminId.toString()).emit("orderAccepted", {
            orderId: updatedOrder._id,
            order: updatedOrder,
          });
        }

        if (status === "completed") {
          io.to(adminId.toString()).emit("completeOrder", updatedOrder._id);
          await Qr.findOneAndUpdate(
            { adminId, tableNumber: updatedOrder.tableNumber },
            { occupied: false }
          );
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
      .populate("userId", "name")
      .populate("customers", "name")
      .populate("items.customerId", "name");

    if (!order) {
      throw new Error("Order not found");
    }
    const subTotal = order.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const gstPercent = order.adminId.gst;
    const gstAmount = (subTotal * gstPercent) / 100;

    const total = Math.round(subTotal + gstAmount);

    const customerMap = new Map();
    for (const item of order.items) {
      const custId = item.customerId?._id?.toString() || "unknown";
      if (!customerMap.has(custId)) {
        customerMap.set(custId, {
          customerId: item.customerId?._id || null,
          name: item.customerId?.name || "Unknown",
          items: [],
          subTotal: 0,
        });
      }
      const entry = customerMap.get(custId);
      entry.items.push({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        amount: item.price * item.quantity,
      });
      entry.subTotal += item.price * item.quantity;
    }

    return {
      cafeName: order.adminId.cafeName,
      address: `${order.adminId.address || ""}, ${order.adminId.city || ""}`,
      tableNumber: order.tableNumber,

      items: order.items.map(item => ({
        customerId: item.customerId?._id || null,
        customerName: item.customerId?.name || "Unknown",
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        amount: item.price * item.quantity,
      })),
      customers: Array.from(customerMap.values()),

      subTotal,
      gstPercent,
      gstAmount,
      total,
      createdAt: order.createdAt,
    };
  },
  getActiveOrderByQr: async (qrId) => {
    if (!qrId) {
      throw new Error("qrId is required");
    }

    const qr = await Qr.findById(qrId).populate("adminId");
    if (!qr) {
      throw new Error("Invalid QR");
    }
    if (!qr.adminId || !qr.adminId.isActive) {
      throw new Error("This QR is disabled because the account is inactive");
    }

    const latestActiveOrder = await Order.findOne({
      adminId: qr.adminId._id,
      tableNumber: qr.tableNumber,
      orderStatus: { $ne: "completed" },
    })
      .sort({ createdAt: -1 })
      .populate("adminId", "name email")
      .populate("userId", "name email phoneNumber")
      .populate("customers", "name email phoneNumber")
      .populate("items.customerId", "name email phoneNumber")
      .populate("items.menuId");

    if (!latestActiveOrder) {
      return { active: false, order: null, tableNumber: qr.tableNumber };
    }

    return {
      active: true,
      message: "An active order already exists. You can add more items.",
      order: latestActiveOrder,
      tableNumber: qr.tableNumber
    };
  },
};

export default orderService;
