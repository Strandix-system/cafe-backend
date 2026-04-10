import crypto from 'crypto';

import Order from '../model/order.js';
import { OrderItem } from '../model/orderItem.js';

export const generateTicketId = () =>
  `TKT-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

export const buildAggregatedItems = (orderItems = []) => {
  const itemMap = new Map();
  for (const item of orderItems) {
    const menuId = `${item.menuId?._id?.toString()}-${item.specialInstruction ?? ''}`;
    if (!itemMap.has(menuId)) {
      const price =
        item.menuId?.discountPrice && item.menuId.discountPrice > 0
          ? item.menuId.discountPrice
          : (item.menuId?.price ?? 0);

      itemMap.set(menuId, {
        menu: {
          _id: item.menuId?._id,
          name: item.menuId?.name,
          price: item.menuId?.price ?? 0,
          discountPrice: item.menuId?.discountPrice ?? 0,
        },
        quantity: 0,
        customers: new Map(),
        price,
        specialInstruction: item.specialInstruction ?? '',
      });
    }
    const entry = itemMap.get(menuId);
    entry.quantity += item.quantity;
    if (item.customerId?._id) {
      const id = item.customerId._id.toString();
      if (!entry.customers.has(id)) {
        entry.customers.set(id, {
          _id: item.customerId._id,
          name: item.customerId.name,
          phoneNumber: item.customerId.phoneNumber,
        });
      }
    }
  }

  return Array.from(itemMap.values()).map((entry) => ({
    menu: entry.menu,
    quantity: entry.quantity,
    price: entry.price,
    customers: Array.from(entry.customers.values()),
    specialInstruction: entry.specialInstruction ?? '',
    amount: entry.price * entry.quantity,
  }));
};

export const generateOrderNumber = async (adminId) => {
  const currentDate = new Date();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  let startYear;
  let endYear;

  if (month >= 4) {
    startYear = year;
    endYear = year + 1;
  } else {
    startYear = year - 1;
    endYear = year;
  }

  const lastOrder = await Order.findOne({
    adminId,
    createdAt: {
      $gte: new Date(`${startYear}-04-01`),
      $lt: new Date(`${endYear}-04-01`),
    },
  })
    .sort({ createdAt: -1 })
    .select('orderNumber');

  let nextSequence = 1;

  if (lastOrder?.orderNumber) {
    nextSequence = parseInt(lastOrder.orderNumber, 10) + 1;
  }

  return String(nextSequence).padStart(4, '0');
};

export const attachOrderItems = async (orders) => {
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
