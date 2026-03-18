import Order from "../../../model/order.js";
import Menu from "../../../model/menu.js";
import Customer from "../../../model/customer.js";
import User from "../../../model/user.js";
import Qr from "../../../model/qr.js";
import OrderItem from "../../../model/orderItem.js";
import { getIO } from "../../../socket.js";
import sendWhatsAppMessage from "../../../utils/whatsapp.js";

const attachOrderItems = async (orders) => {
  if (!orders || !orders.length) return [];
  const orderIds = orders.map((o) => o._id);
  const items = await OrderItem.find({ orderId: { $in: orderIds } })
    .populate("menuId")
    .populate("customerId", "name email phoneNumber");

  const grouped = new Map();
  for (const item of items) {
    const id = item.orderId.toString();
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id).push(item);
  }

  return orders.map((order) => ({
    order,
    orderItems: grouped.get(order._id.toString()) || [],
  }));
};

const buildAggregatedItems = (orderItems = []) => {
  const itemMap = new Map();
  for (const item of orderItems) {
    const menuId = item.menuId?._id?.toString() || "unknown";
    if (!itemMap.has(menuId)) {
      itemMap.set(menuId, {
        menuId: item.menuId,
        name: item.menuId?.name || "Unknown",
        quantity: 0,
        customers: new Map(),
        price:
          item.menuId?.discountPrice && item.menuId.discountPrice > 0
            ? item.menuId.discountPrice
            : item.menuId?.price || 0,
      });
    }
    const entry = itemMap.get(menuId);
    entry.quantity += item.quantity || 0;
    if (item.customerId?._id) {
      const id = item.customerId._id.toString();
      if (!entry.customers.has(id)) {
        entry.customers.set(id, {
          _id: item.customerId._id,
          name: item.customerId.name,
          phoneNumber: item.customerId.phoneNumber,
          email: item.customerId.email,
        });
      }
    }
  }

  return Array.from(itemMap.values()).map((entry) => ({
    ...entry,
    customers: Array.from(entry.customers.values()),
    amount: entry.price * entry.quantity,
  }));
};

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
      isCompleted: false,
    }).sort({ createdAt: -1 });

    let order = null;

    const isWithinThreeHours =
      latestActiveOrder &&
      latestActiveOrder.createdAt &&
      latestActiveOrder.createdAt >= threeHoursAgo;

    const createOrderItems = async (orderId, newItems) => {
      await OrderItem.insertMany(
        newItems.map((item) => ({
          ...item,
          orderId,
          status: "pending",
        }))
      );
    };

    if (qr.occupied && latestActiveOrder) {
      await createOrderItems(
        latestActiveOrder._id,
        finalItems
      );
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
      order = await latestActiveOrder.save();
    } else if (latestActiveOrder && isWithinThreeHours) {
      await createOrderItems(
        latestActiveOrder._id,
        finalItems
      );
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
        tableNumber,
        specialInstruction,
        totalAmount: Math.round(finalTotal),
        gstPercent,
        gstAmount,
        subTotal
      });
      await createOrderItems(order._id, finalItems);

      qr.occupied = true;
      await qr.save();
    }

    const io = getIO();

    const populatedOrder = await Order.findById(order._id)
      .populate("adminId", "name email");

    const [{ orderItems }] = await attachOrderItems([populatedOrder]);
    const aggregatedItems = buildAggregatedItems(orderItems);
    const orderWithItems = {
      ...populatedOrder.toObject(),
      items: aggregatedItems,
      orderItems: orderItems.map((i) => i.toObject()),
    };

    io.to(adminId.toString()).emit("newOrder", orderWithItems);
    io.to(adminId.toString()).emit("order:new", orderWithItems);
    const customerIds = await OrderItem.distinct("customerId", {
      orderId: order._id,
    });
    for (const custId of customerIds) {
      const id = custId.toString();
      io.to(`customer-${id}`).emit("order:new", orderWithItems);
    }

    return orderWithItems;
  },
  getOrders: async (adminId, filter, options) => {
    if (filter?.isCompleted !== undefined) {
      if (typeof filter.isCompleted === "string") {
        filter.isCompleted = filter.isCompleted.toLowerCase() === "true";
      }
    }

    const { populate: _populate, ...safeOptions } = options || {};
    const result = await Order.paginate({ adminId, ...filter }, safeOptions);

    const ordersWithItems = await attachOrderItems(result.results);
    result.results = ordersWithItems.map(({ order, orderItems }) => ({
      ...order.toObject(),
      items: buildAggregatedItems(orderItems),
      orderItems: orderItems.map((i) => i.toObject()),
    }));

    return result;
  },
  getMyOrders: async (filter, options) => {
  if (!filter.userId) {
    throw new Error("userId is required to fetch customer's orders");
  }

  const { userId, ...restFilter } = filter;

  const orderIds = await OrderItem.distinct("orderId", {
    customerId: userId,
  });

  if (!orderIds.length) {
   
    return {
      results: [],
      page: Number(options?.page) || 0,
      limit: Number(options?.limit) || 0,
      totalPages: 0,
      totalResults: 0,
    };
  }

  const finalFilter = { ...restFilter, _id: { $in: orderIds } };

  const { populate: _populate, ...safeOptions } = options || {};
  const result = await Order.paginate(finalFilter, safeOptions);

  const ordersWithItems = await attachOrderItems(result.results);
  result.results = ordersWithItems.map(({ order, orderItems }) => ({
    ...order.toObject(),
    items: buildAggregatedItems(orderItems),
    orderItems: orderItems.map((i) => i.toObject()),
  }));

  return result;
},
  updateIsCompletedStatus: async (orderId, isCompleted, adminId) => {
    try {
      if (isCompleted === undefined || isCompleted === null) {
        throw new Error("Order completion status is required");
      }
      if (typeof isCompleted !== "boolean") {
        throw new Error("isCompleted must be true or false");
      }

      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, adminId },
        { isCompleted },
        {
          new: true,
          runValidators: true,
        }
      ).populate("adminId", "name email");


      if (!updatedOrder) {
        throw new Error("Order not found");
      }

      const [{ orderItems }] = await attachOrderItems([updatedOrder]);
      const orderWithItems = {
        ...updatedOrder.toObject(),
        items: buildAggregatedItems(orderItems),
        orderItems: orderItems.map((i) => i.toObject()),
      };

      try {
        const io = getIO();

        io.to(adminId.toString()).emit("orderStatusUpdate", {
          orderId: updatedOrder._id,
          isCompleted,
          order: orderWithItems,
        });
        io.to(adminId.toString()).emit("order:statusUpdated", {
          orderId: updatedOrder._id,
          isCompleted,
          order: orderWithItems,
        });

        const customerIds = await OrderItem.distinct("customerId", {
          orderId: updatedOrder._id,
        });
        for (const custId of customerIds) {
          const id = custId.toString();
          io.to(`customer-${id}`).emit("orderStatusUpdate", {
            orderId: updatedOrder._id,
            isCompleted,
            order: orderWithItems,
          });
          io.to(`customer-${id}`).emit("order:statusUpdated", {
            orderId: updatedOrder._id,
            isCompleted,
            order: orderWithItems,
          });
        }

        if (isCompleted === true) {
          io.to(adminId.toString()).emit("completeOrder", updatedOrder._id);
          await Qr.findOneAndUpdate(
            { adminId, tableNumber: updatedOrder.tableNumber },
            { occupied: false }
          );
        }
      } catch (socketError) {
        console.error("Socket emission error:", socketError);
      }

      return orderWithItems;
    } catch (error) {

      throw new Error(`Error updating order: ${error.message}`);
    }
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
      if (!order.isCompleted) {
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
            .populate("adminId", "cafeName");

          const customerIds = await OrderItem.distinct("customerId", {
            orderId,
          });
          if (customerIds.length) {
            const customers = await Customer.find({
              _id: { $in: customerIds },
            }).select("name phoneNumber");

            for (const customer of customers) {
              if (!customer?.phoneNumber) continue;

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
      .populate("adminId", "cafeName gst address city state pincode");

    if (!order) {
      throw new Error("Order not found");
    }
    const orderItems = await OrderItem.find({ orderId })
      .populate("customerId", "name")
      .populate("menuId", "name price discountPrice");

    const subTotal = orderItems.reduce((sum, item) => {
      const menu = item.menuId;
      const price = menu?.discountPrice && menu.discountPrice > 0
        ? menu.discountPrice
        : menu?.price || 0;
      return sum + price * item.quantity;
    }, 0);

    const gstPercent = order.adminId.gst;
    const gstAmount = (subTotal * gstPercent) / 100;

    const total = Math.round(subTotal + gstAmount);

    const customerMap = new Map();
    for (const item of orderItems) {
      const custId = item.customerId?._id?.toString() || "unknown";
      if (!customerMap.has(custId)) {
        customerMap.set(custId, {
          customerId: item.customerId?._id || null,
          name: item.customerId?.name || "Unknown",
          items: new Map(),
          subTotal: 0,
        });
      }
      const entry = customerMap.get(custId);
      const menuId = item.menuId?._id?.toString() || "unknown";
      if (!entry.items.has(menuId)) {
        entry.items.set(menuId, {
          name: item.menuId?.name || "Unknown",
          quantity: 0,
          price:
            item.menuId?.discountPrice && item.menuId.discountPrice > 0
              ? item.menuId.discountPrice
              : item.menuId?.price || 0,
        });
      }
      const itemEntry = entry.items.get(menuId);
      itemEntry.quantity += item.quantity || 0;
      entry.subTotal += itemEntry.price * (item.quantity || 0);
    }

    const customers = Array.from(customerMap.values()).map((entry) => ({
      customerId: entry.customerId,
      name: entry.name,
      items: Array.from(entry.items.values()).map((i) => ({
        ...i,
        amount: i.price * i.quantity,
      })),
      subTotal: entry.subTotal,
    }));

    return {
      cafeName: order.adminId.cafeName,
      address: `${order.adminId.address || ""}, ${order.adminId.city || ""}`,
      tableNumber: order.tableNumber,

      items: customers.flatMap((c) =>
        c.items.map((i) => ({
          customerId: c.customerId || null,
          customerName: c.name || "Unknown",
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          amount: i.amount,
        }))
      ),
      customers,

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
      isCompleted: false,
    })
      .sort({ createdAt: -1 })
      .populate("adminId", "name email");

    if (!latestActiveOrder) {
      return { active: false, order: null, tableNumber: qr.tableNumber };
    }

    const [{ orderItems }] = await attachOrderItems([latestActiveOrder]);
    const orderWithItems = {
      ...latestActiveOrder.toObject(),
      items: buildAggregatedItems(orderItems),
      orderItems: orderItems.map((i) => i.toObject()),
    };

    return {
      active: true,
      message: "An active order already exists. You can add more items.",
      order: orderWithItems,
      tableNumber: qr.tableNumber
    };
  },
};

export default orderService;
