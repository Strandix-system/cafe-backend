import Customer from '../../../model/customer.js';
import Menu from '../../../model/menu.js';
import Order from '../../../model/order.js';
import { OrderItem } from '../../../model/orderItem.js';
import Qr from '../../../model/qr.js';
import User from '../../../model/user.js';
import { getIO } from '../../../socket.js';
import { ApiError } from '../../../utils/apiError.js';
import {
  ENTITY_TYPES,
  NOTIFICATION_TYPES,
  ORDER_STATUS,
  RECIPIENT_TYPES,
} from '../../../utils/constants.js';
import { buildAggregatedItems } from '../../../utils/utils.js';
import { generateOrderNumber } from '../../../utils/utils.js';
import sendWhatsAppMessage from '../../../utils/whatsapp.js';
import { notificationService } from '../../notification/notification.service.js';

const attachOrderItems = async (orders) => {
  if (!orders || !orders.length) return [];
  const orderIds = orders.map((o) => o._id);
  const items = await OrderItem.find({ orderId: { $in: orderIds } })
    .populate('menuId')
    .populate('customerId', 'name email phoneNumber');

  const grouped = new Map();
  for (const item of items) {
    const id = item.orderId.toString();
    if (!grouped.has(id)) grouped.set(id, []);
    grouped.get(id).push(item);
  }

  return orders.map((order) => ({
    order,
    orderItems: grouped.get(order._id.toString()) ?? [],
  }));
};

export const orderService = {
  createOrderByCustomerId: async (body) => {
    const { items, customerId, tableNumber } = body;
    const customer = await Customer.findById(customerId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    const adminId = customer.adminId;
    if (!adminId) {
      throw new ApiError(400, 'Customer adminId is missing');
    }

    const admin = await User.findOne({ _id: adminId, role: 'admin' }).select(
      'gst',
    );
    if (!admin) {
      throw new ApiError(404, 'Admin not found');
    }

    const gstPercent = admin.gst;
    const menuIds = items.map((menu) => menu.menuId);
    const menus = await Menu.find({
      _id: { $in: menuIds },
    });

    if (menus?.length !== items.length) {
      throw new ApiError(400, 'Invalid menu item');
    }

    let subTotal = 0;

    const finalItems = items.map((item) => {
      const menu = menus.find((m) => m._id.toString() === item.menuId);

      const price =
        menu.discountPrice && menu.discountPrice > 0
          ? menu.discountPrice
          : menu.price;

      subTotal += price * item.quantity;

      return {
        customerId: item.customerId ?? customerId,
        menuId: item.menuId,
        quantity: item.quantity,
        specialInstruction: item.specialInstruction ?? '',
      };
    });

    if (finalItems.some((item) => !item.customerId)) {
      throw new ApiError(400, 'customerId is required for each item');
    }

    const gstAmount = (subTotal * gstPercent) / 100;
    const finalTotal = subTotal + gstAmount;

    const qr = await Qr.findOne({ adminId, tableNumber });
    if (!qr) {
      throw new ApiError(404, 'Table not found');
    }

    const latestActiveOrder = await Order.findOne({
      adminId,
      tableNumber,
      isCompleted: false,
    }).sort({ createdAt: -1 });

    let order = null;

    const createOrderItems = async (orderId, newItems) => {
      await OrderItem.insertMany(
        newItems.map((item) => ({
          ...item,
          orderId,
          status: ORDER_STATUS.PENDING,
        })),
      );
    };

    if (qr.occupied && latestActiveOrder) {
      await createOrderItems(latestActiveOrder._id, finalItems);

      latestActiveOrder.subTotal = (latestActiveOrder.subTotal ?? 0) + subTotal;
      latestActiveOrder.gstPercent = gstPercent;
      latestActiveOrder.gstAmount =
        (latestActiveOrder.subTotal * gstPercent) / 100;
      latestActiveOrder.totalAmount = Math.round(
        latestActiveOrder.subTotal + latestActiveOrder.gstAmount,
      );
      order = await latestActiveOrder.save();
    } else if (latestActiveOrder) {
      await createOrderItems(latestActiveOrder._id, finalItems);

      latestActiveOrder.subTotal = (latestActiveOrder.subTotal ?? 0) + subTotal;
      latestActiveOrder.gstPercent = gstPercent;
      latestActiveOrder.gstAmount =
        (latestActiveOrder.subTotal * gstPercent) / 100;
      latestActiveOrder.totalAmount = Math.round(
        latestActiveOrder.subTotal + latestActiveOrder.gstAmount,
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

      const orderNumber = await generateOrderNumber(adminId);

      order = await Order.create({
        adminId,
        orderBy: customerId,
        tableNumber,
        totalAmount: Math.round(finalTotal),
        gstPercent,
        gstAmount,
        subTotal,
        orderNumber,
      });
      await createOrderItems(order._id, finalItems);

      qr.occupied = true;
      await qr.save();
    }

    const io = getIO();

    const populatedOrder = await Order.findById(order._id).populate(
      'adminId',
      'name email',
    );

    const [{ orderItems }] = await attachOrderItems([populatedOrder]);
    const aggregatedItems = buildAggregatedItems(orderItems);
    const orderWithItems = {
      ...populatedOrder.toObject(),
      items: aggregatedItems,
      orderItems: orderItems.map((i) => i.toObject()),
    };

    io.to(adminId.toString()).emit('order:new', orderWithItems);
    const customerIds = await OrderItem.distinct('customerId', {
      orderId: order._id,
    });

    for (const custId of customerIds) {
      const id = custId.toString();

      // FULL TABLE ORDER (for shared view)
      io.to(`customer-${id}`).emit('table:orderUpdated', {
        order: orderWithItems,
      });

      // PERSONAL ORDER (for "My Orders")
      const myItems = orderItems.filter(
        (item) => item.customerId?._id?.toString() === id,
      );

      io.to(`customer-${id}`).emit('my:orderUpdated', {
        orderId: order._id,
        items: buildAggregatedItems(myItems),
      });
    }

    return orderWithItems;
  },
  // offline order created by admin from admin panel.
  createOfflineOrderByAdmin: async (body, user) => {
    const { items, tableNumber, customer } = body;

    const adminId = user?._id;
    if (!adminId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const admin = await User.findOne({ _id: adminId, role: 'admin' }).select(
      'gst',
    );
    if (!admin) {
      throw new ApiError(404, 'Admin not found');
    }

    const gstPercent = admin.gst;

    const phoneNumber = customer?.phoneNumber ?? '';
    const name = customer?.name ?? '';

    let dbCustomer = await Customer.findOne({ phoneNumber, adminId });
    if (dbCustomer) {
      if (name && dbCustomer.name !== name) {
        dbCustomer.name = name;
        await dbCustomer.save();
      }
    } else {
      dbCustomer = await Customer.create({ name, phoneNumber, adminId });
    }

    const customerId = dbCustomer._id;

    const menuIds = items.map((menu) => menu.menuId);
    const menus = await Menu.find({
      _id: { $in: menuIds },
    });

    if (menus?.length !== items.length) {
      throw new ApiError(400, 'Invalid menu item');
    }

    let subTotal = 0;

    const finalItems = items.map((item) => {
      const menu = menus.find((m) => m._id.toString() === item.menuId);

      const price =
        menu.discountPrice && menu.discountPrice > 0
          ? menu.discountPrice
          : menu.price;

      subTotal += price * item.quantity;

      return {
        customerId,
        menuId: item.menuId,
        quantity: item.quantity,
        specialInstruction: item.specialInstruction ?? '',
      };
    });

    const gstAmount = (subTotal * gstPercent) / 100;
    const finalTotal = subTotal + gstAmount;

    const qr = await Qr.findOne({ adminId, tableNumber });
    if (!qr) {
      throw new ApiError(404, 'Table not found');
    }

    const latestActiveOrder = await Order.findOne({
      adminId,
      tableNumber,
      isCompleted: false,
    }).sort({ createdAt: -1 });

    const createOrderItems = async (orderId, newItems) => {
      await OrderItem.insertMany(
        newItems.map((item) => ({
          ...item,
          orderId,
          status: ORDER_STATUS.PENDING,
        })),
      );
    };

    let order;

    if (latestActiveOrder) {
      if (!latestActiveOrder.orderBy.equals(adminId)) {
        throw new ApiError(
          403,
          'This active order was created by customer; admin cannot add items via offline flow',
        );
      }

      await createOrderItems(latestActiveOrder._id, finalItems);

      latestActiveOrder.subTotal = (latestActiveOrder.subTotal ?? 0) + subTotal;
      latestActiveOrder.gstPercent = gstPercent;
      latestActiveOrder.gstAmount =
        (latestActiveOrder.subTotal * gstPercent) / 100;
      latestActiveOrder.totalAmount = Math.round(
        latestActiveOrder.subTotal + latestActiveOrder.gstAmount,
      );
      order = await latestActiveOrder.save();

      if (!qr.occupied) {
        qr.occupied = true;
        await qr.save();
      }
    } else {
      if (qr.occupied) {
        qr.occupied = false;
        await qr.save();
      }

      const orderNumber = await generateOrderNumber(adminId);

      order = await Order.create({
        adminId,
        orderBy: adminId,
        tableNumber,
        totalAmount: Math.round(finalTotal),
        gstPercent,
        gstAmount,
        subTotal,
        orderNumber,
      });
      await createOrderItems(order._id, finalItems);

      qr.occupied = true;
      await qr.save();
    }

    const io = getIO();

    const populatedOrder = await Order.findById(order._id).populate(
      'adminId',
      'name email',
    );

    const [{ orderItems }] = await attachOrderItems([populatedOrder]);
    const aggregatedItems = buildAggregatedItems(orderItems);
    const orderWithItems = {
      ...populatedOrder.toObject(),
      items: aggregatedItems,
      orderItems: orderItems.map((i) => i.toObject()),
    };

    io.to(adminId.toString()).emit('order:new', orderWithItems);
    const customerIds = await OrderItem.distinct('customerId', {
      orderId: order._id,
    });
    for (const custId of customerIds) {
      const id = custId.toString();
      io.to(`customer-${id}`).emit('order:new', orderWithItems);
    }

    await notificationService.createNotification({
      title: 'New order received',
      message: `A new order has been placed for table ${order.tableNumber}.`,
      notificationType: NOTIFICATION_TYPES.ORDER_CREATED,
      recipientType: RECIPIENT_TYPES.ADMIN,
      userId: adminId,
      adminId,
      entityType: ENTITY_TYPES.ORDER,
      entityId: order._id,
    });

    return orderWithItems;
  },
  getOrders: async (adminId, filter, options) => {
    if (filter?.isCompleted !== undefined) {
      if (typeof filter.isCompleted === 'string') {
        filter.isCompleted = filter.isCompleted.toLowerCase() === 'true';
      }
    }

    const { populate: _populate, ...safeOptions } = options ?? {};
    const query = { adminId };

    if (filter?.isCompleted !== undefined) {
      query.isCompleted = filter.isCompleted;
    }

    if (filter?.tableNumber !== undefined) {
      query.tableNumber = Number(filter.tableNumber);
    }

    if (filter?.paymentStatus !== undefined) {
      query.paymentStatus =
        typeof filter.paymentStatus === 'string'
          ? filter.paymentStatus.toLowerCase() === 'true'
          : filter.paymentStatus;
    }

    if (filter?.search) {
      const searchValue = filter.search.trim();

      const isOrderNumberSearch =
        searchValue.length > 1 || searchValue.startsWith('0');

      if (isOrderNumberSearch) {
        query.orderNumber = new RegExp(searchValue, 'i');
      } else {
        query.tableNumber = Number(searchValue);
      }
    }

    const result = await Order.paginate(query, safeOptions);

    const ordersWithItems = await attachOrderItems(result.results);
    result.results = ordersWithItems.map(({ order, orderItems }) => ({
      ...order.toObject(),
      items: buildAggregatedItems(orderItems),
      orderItems: orderItems.map((i) => ({
        _id: i._id,
        menuId: i.menuId?._id,
        customerId: i.customerId?._id,
        quantity: i.quantity,
        status: i.status,
        specialInstruction: i.specialInstruction ?? '',
        timestamps: {
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        },
      })),
    }));
    return result;
  },
  getMyOrders: async (filter, options) => {
    const { userId, ...restFilter } = filter;

    const orderIds = await OrderItem.distinct('orderId', {
      customerId: userId,
    });

    if (!orderIds.length) {
      return {
        results: [],
        page: Number(options?.page ?? 0),
        limit: Number(options?.limit ?? 0),
        totalPages: 0,
        totalResults: 0,
      };
    }

    const finalFilter = { ...restFilter, _id: { $in: orderIds } };

    const { populate: _populate, ...safeOptions } = options ?? {};
    const result = await Order.paginate(finalFilter, safeOptions);

    const ordersWithItems = await attachOrderItems(result.results);
    result.results = ordersWithItems.map(({ order, orderItems }) => ({
      ...order.toObject(),
      items: buildAggregatedItems(orderItems),
      orderItems: orderItems.map((i) => ({
        _id: i._id,
        menuId: i.menuId?._id,
        customerId: i.customerId?._id,
        quantity: i.quantity,
        status: i.status,
        specialInstruction: i.specialInstruction ?? '',
        timestamps: {
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        },
      })),
    }));

    return result;
  },
  updateIsCompletedStatus: async (orderId, isCompleted, adminId) => {
    try {
      if (isCompleted === true) {
        await OrderItem.updateMany(
          {
            orderId,
            status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING] },
          },
          {
            $set: {
              status: 'served',
              servedAt: new Date(), // optional but useful
            },
          },
        );
      }

      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, adminId },
        { isCompleted },
        {
          new: true,
          runValidators: true,
        },
      ).populate('adminId', 'name email');

      if (!updatedOrder) {
        throw new ApiError(404, 'Order not found');
      }
      const [{ orderItems }] = await attachOrderItems([updatedOrder]);
      const orderWithItems = {
        ...updatedOrder.toObject(),
        items: buildAggregatedItems(orderItems),
        orderItems: orderItems.map((i) => i.toObject()),
      };

      try {
        const io = getIO();
        const customerIds = await OrderItem.distinct('customerId', {
          orderId: updatedOrder._id,
        });

        io.to(adminId.toString()).emit('orderStatusUpdate', {
          orderId: updatedOrder._id,
          isCompleted,
          order: orderWithItems,
        });

        for (const custId of customerIds) {
          const id = custId.toString();
          io.to(`customer-${id}`).emit('orderStatusUpdate', {
            orderId: updatedOrder._id,
            isCompleted,
            order: orderWithItems,
          });
        }

        if (isCompleted === true) {
          io.to(adminId.toString()).emit('completeOrder', updatedOrder._id);
          await Qr.findOneAndUpdate(
            { adminId, tableNumber: updatedOrder.tableNumber },
            { occupied: false },
          );
        }
      } catch (socketError) {
        console.error('Socket emission error:', socketError);
      }

      try {
        const customerIds = await OrderItem.distinct('customerId', {
          orderId: updatedOrder._id,
        });

        await Promise.all(
          customerIds.map((custId) =>
            notificationService.createNotification({
              title: 'Order status updated',
              message: isCompleted
                ? `Your order for table ${updatedOrder.tableNumber} is completed.`
                : `Your order for table ${updatedOrder.tableNumber} was updated.`,
              notificationType: NOTIFICATION_TYPES.ORDER_STATUS_UPDATED,
              recipientType: RECIPIENT_TYPES.CUSTOMER,
              customerId: custId,
              adminId,
              entityType: ENTITY_TYPES.ORDER,
              entityId: updatedOrder._id,
            }),
          ),
        );
      } catch (notificationError) {
        console.error('Order status notification error:', notificationError);
      }

      return orderWithItems;
    } catch (error) {
      throw new ApiError(500, `Error updating order: ${error.message}`);
    }
  },
  updatePaymentStatus: async (orderId, paymentStatus, adminId) => {
    try {
      const order = await Order.findOne({ _id: orderId, adminId });

      if (!order) {
        throw new ApiError(404, 'Order not found');
      }

      if (!order.isCompleted) {
        throw new ApiError(
          400,
          "Payment status can only be updated when order is completed"
        );
      }

      if (order.paymentStatus === paymentStatus) {
        return order;
      }

      order.paymentStatus = paymentStatus;
      await order.save();

      if (paymentStatus === true) {
        try {
          const [billDetails, populatedOrder] = await Promise.all([
            orderService.getOrderBillDetails(orderId, adminId),
            Order.findById(orderId).populate("adminId", "cafeName"),
          ]);

          const customerIds = await OrderItem.distinct('customerId', {
            orderId,
          });

          if (customerIds.length) {
            const customers = await Customer.find({
              _id: { $in: customerIds },
            }).select('name phoneNumber');

            await Promise.all(
              customers.map((customer) => {
                if (!customer?.phoneNumber) return null;

                const formattedPhone = `91${customer.phoneNumber}`;

                const message = `
Hello ${customer.name},

✅ Payment received successfully.

🧾 Order Summary:
Table No: ${billDetails.tableNumber}
Total Amount: Rs.${billDetails.total}

Your bill PDF is ready in the app.

Thank you for visiting ${populatedOrder.adminId.cafeName}
See you again!
              `;

                return sendWhatsAppMessage({
                  to: formattedPhone,
                  message,
                });
              })
            );
          }
        } catch (_whatsappError) { }
      }

      return order;
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  },
  deleteOrder: async (orderId, adminId) => {
    const order = await Order.findOne({ _id: orderId, adminId });
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    await OrderItem.deleteMany({ orderId });
    await Order.deleteOne({ _id: orderId });

    if (!order.isCompleted) {
      await Qr.findOneAndUpdate(
        { adminId, tableNumber: order.tableNumber },
        { occupied: false },
      );
    }
    return order;
  },
  getOrderBillDetails: async (orderId, adminId) => {
    const order = await Order.findOne({
      _id: orderId,
      adminId,
    }).populate(
      'adminId',
      'cafeName gst address city state pincode phoneNumber',
    );

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }
    const orderItems = await OrderItem.find({ orderId })
      .populate('customerId', 'name')
      .populate('menuId', 'name price discountPrice');

    const subTotal = orderItems.reduce((sum, item) => {
      const menu = item.menuId;
      const price =
        menu?.discountPrice && menu.discountPrice > 0
          ? menu.discountPrice
          : menu?.price;
      return sum + price * item.quantity;
    }, 0);

    const gstPercent = order.adminId.gst;
    const gstAmount = (subTotal * gstPercent) / 100;
    const total = Math.round(subTotal + gstAmount);

    const customerMap = new Map();
    for (const item of orderItems) {
      const custId = item.customerId?._id?.toString() ?? 'unknown';
      if (!customerMap.has(custId)) {
        customerMap.set(custId, {
          customerId: item.customerId?._id ?? null,
          name: item.customerId?.name ?? 'Unknown',
          items: new Map(),
          subTotal: 0,
        });
      }
      const entry = customerMap.get(custId);
      const menuId = `${item.menuId?._id?.toString()}-${item.specialInstruction ?? ''}`;
      if (!entry.items.has(menuId)) {
        entry.items.set(menuId, {
          name: item.menuId?.name ?? 'Unknown',
          quantity: 0,
          price:
            item.menuId?.discountPrice && item.menuId.discountPrice > 0
              ? item.menuId.discountPrice
              : (item.menuId?.price ?? 0),
          specialInstruction: item.specialInstruction ?? '',
        });
      }
      const itemEntry = entry.items.get(menuId);
      itemEntry.quantity += item.quantity ?? 0;
      entry.subTotal += itemEntry.price * (item.quantity ?? 0);
    }

    const customers = {};

    for (const entry of customerMap.values()) {
      const customerName = entry.name ?? 'Unknown';

      customers[customerName] = Array.from(entry.items.values()).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        amount: i.price * i.quantity,
        specialInstruction: i.specialInstruction ?? '',
      }));
    }

    return {
      cafeName: order.adminId.cafeName,
      address: `${order.adminId.address ?? ''}, ${order.adminId.city ?? ''}`,
      phoneNumber: order.adminId.phoneNumber,
      tableNumber: order.tableNumber,
      customers,
      subTotal,
      gstPercent,
      gstAmount,
      total,
      createdAt: order.createdAt,
    };
  },
  getActiveOrderByQr: async (qrId, customerId) => {
    const qr = await Qr.findById(qrId).populate('adminId');
    if (!qr) {
      throw new ApiError(400, 'Invalid QR');
    }
    if (!qr.adminId || !qr.adminId.isActive) {
      throw new ApiError(
        400,
        'This QR is disabled because the account is inactive',
      );
    }

    if (customerId) {
      const existingOrderItem = await OrderItem.findOne({ customerId }).sort({
        createdAt: -1,
      });

      if (existingOrderItem) {
        const existingOrder = await Order.findOne({
          _id: existingOrderItem.orderId,
          isCompleted: false,
        }).populate('adminId', 'name email');

        if (existingOrder) {
          const [{ orderItems }] = await attachOrderItems([existingOrder]);

          const orderWithItems = {
            ...existingOrder.toObject(),
            pricing: {
              subTotal: existingOrder.subTotal,
              gstPercent: existingOrder.gstPercent,
              gstAmount: existingOrder.gstAmount,
              totalAmount: existingOrder.totalAmount,
            },
            status: {
              isCompleted: existingOrder.isCompleted,
              paymentStatus: existingOrder.paymentStatus,
            },
            items: buildAggregatedItems(orderItems),
            orderItems: orderItems.map((i) => ({
              _id: i._id,
              menuId: i.menuId?._id,
              customerId: i.customerId?._id,
              quantity: i.quantity,
              status: i.status,
              servedAt: i.servedAt,
              timestamps: {
                createdAt: i.createdAt,
                updatedAt: i.updatedAt,
              },
            })),
            timestamps: {
              createdAt: existingOrder.createdAt,
              updatedAt: existingOrder.updatedAt,
            },
          };

          return {
            active: true,
            isDifferentTable: existingOrder.tableNumber !== qr.tableNumber,
            message: 'You already have an active order',
            order: orderWithItems,
            currentTable: existingOrder.tableNumber,
            newTable: qr.tableNumber,
          };
        }
      }
    }

    const latestActiveOrder = await Order.findOne({
      adminId: qr.adminId._id,
      tableNumber: qr.tableNumber,
      isCompleted: false,
    })
      .sort({ createdAt: -1 })
      .populate('adminId', 'name email');

    if (!latestActiveOrder) {
      return { active: false, order: null, tableNumber: qr.tableNumber };
    }

    if (customerId) {
      const customerIds = await OrderItem.distinct('customerId', {
        orderId: latestActiveOrder._id,
      });

      const isOwner = customerIds.some(
        (id) => id.toString() === customerId.toString(),
      );

      if (!isOwner) {
        return {
          active: false,
          message: 'Start a new order',
          tableNumber: qr.tableNumber,
        };
      }
    }
    const [{ orderItems }] = await attachOrderItems([latestActiveOrder]);
    const orderWithItems = {
      ...latestActiveOrder.toObject(),

      pricing: {
        subTotal: latestActiveOrder.subTotal,
        gstPercent: latestActiveOrder.gstPercent,
        gstAmount: latestActiveOrder.gstAmount,
        totalAmount: latestActiveOrder.totalAmount,
      },

      status: {
        isCompleted: latestActiveOrder.isCompleted,
        paymentStatus: latestActiveOrder.paymentStatus,
      },

      items: buildAggregatedItems(orderItems),

      orderItems: orderItems.map((i) => ({
        _id: i._id,
        menuId: i.menuId?._id,
        customerId: i.customerId?._id,
        quantity: i.quantity,
        status: i.status,
        servedAt: i.servedAt,
        timestamps: {
          createdAt: i.createdAt,
          updatedAt: i.updatedAt,
        },
      })),

      timestamps: {
        createdAt: latestActiveOrder.createdAt,
        updatedAt: latestActiveOrder.updatedAt,
      },
    };

    return {
      active: true,
      message: 'An active order already exists. You can add more items.',
      order: orderWithItems,
      tableNumber: qr.tableNumber,
    };
  },
  changeTable: async (orderId, newTableNumber, user) => {
    const order = await Order.findOne({
      _id: orderId,
      isCompleted: false,
    });

    if (!order) {
      throw new ApiError(404, 'Active order not found');
    }

    if (user.role !== 'admin') {
      throw new ApiError(403, 'Only admin can change table');
    }

    const oldTableNumber = order.tableNumber;

    if (oldTableNumber === newTableNumber) {
      throw new ApiError(400, 'Order is already on this table');
    }

    const adminId = order.adminId;

    const newQr = await Qr.findOne({ adminId, tableNumber: newTableNumber });
    if (!newQr) {
      throw new ApiError(404, 'Target table not found');
    }

    if (newQr.occupied) {
      throw new ApiError(400, 'Target table is already occupied');
    }

    const oldQr = await Qr.findOne({ adminId, tableNumber: oldTableNumber });

    order.tableNumber = newTableNumber;
    await order.save();

    if (oldQr) {
      oldQr.occupied = false;
      await oldQr.save();
    }

    newQr.occupied = true;
    await newQr.save();

    return {
      message: 'Table changed successfully',
      orderId: order._id,
      oldTableNumber,
      newTableNumber,
    };
  },
};
