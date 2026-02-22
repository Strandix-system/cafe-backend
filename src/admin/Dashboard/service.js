//dashboard service

import mongoose from "mongoose";
import User from "../../../model/user.js";
import Order from "../../../model/order.js";
import Customer from "../../../model/customer.js";

const buildGroupId = (type) => {
  switch (type) {
    case "weekly":
      return {
        year: { $year: "$createdAt" },
        week: { $isoWeek: "$createdAt" },
      };

    case "monthly":
      return {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };

    default: // daily
      return {
        date: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
      };
  }
};

const dashboardService = {
  superAdminStats: async () => {
    const [totalCafe, totalActive, totalInActive, incomeAgg] =
      await Promise.all([
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "admin", isActive: true }),
        User.countDocuments({ role: "admin", isActive: false }),
        Order.aggregate([
          { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ])
      ]);

    return {
      totalCafe,
      totalActive,
      totalInActive,
      totalIncome: incomeAgg[0]?.total || 0,
    };
  },
  adminStats: async (adminId) => {
    //  const id = toObjectId(adminId);
    const id = new mongoose.Types.ObjectId(adminId);

    const now = new Date();

    const start = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ));

    const end = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23, 59, 59, 999
    ));

    const [
      totalCustomer,
      totalOrder,
      totalIncomeAgg,

      todayCustomerAgg,
      todayOrder,
      todayIncomeAgg,
    ] = await Promise.all([

      // TOTAL
      Customer.countDocuments({ adminId: id }),
      Order.countDocuments({ adminId: id }),
      Order.aggregate([
        { $match: { adminId: id } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),

      // TODAY
      Order.aggregate([
        {
          $match: {
            adminId: id,
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: { _id: "$customerId" }
        }
      ]),
      Order.countDocuments({
        adminId: id,
        createdAt: { $gte: start, $lte: end }
      }),
      Order.aggregate([
        {
          $match: {
            adminId: id,
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" }
          }
        }
      ]),
    ]);


    return {
      totalCustomer,
      totalOrder,
      totalIncome: totalIncomeAgg[0]?.total || 0,
      todayCustomer: todayCustomerAgg.length,
      todayOrder,
      todayIncome: todayIncomeAgg[0]?.total || 0,
    };
  },
  salesChart: async (adminId, type) => {
    const id = new mongoose.Types.ObjectId(adminId);

    const allowed = ["daily", "weekly", "monthly"];
    const safeType = allowed.includes(type) ? type : "daily";

    const sales = await Order.aggregate([
      { $match: { adminId: id } },
      { $group: { _id: buildGroupId(safeType), total: { $sum: "$totalAmount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1, "_id.date": 1 } },
    ]);

    return sales.map((item) => ({
      _id:
        safeType === "daily"
          ? item._id.date
          : safeType === "weekly"
            ? `W${item._id.week}-${item._id.year}`
            : `${item._id.month}-${item._id.year}`,
      total: item.total,
    }));
  },
  itemPerformance: async (adminId) => {

    const id = new mongoose.Types.ObjectId(adminId);

    const pipeline = (sortOrder) => ([
      { $match: { adminId: id } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          quantity: { $sum: "$items.quantity" }
        }
      },
      { $sort: { quantity: sortOrder } },
      { $limit: 1 },
      {
        $lookup: {
          from: "menus",
          localField: "_id",
          foreignField: "name",
          as: "menu"
        }
      },
      { $unwind: { path: "$menu", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 0,
          name: "$_id",
          quantity: 1,
          image: "$menu.image"
        }
      }
    ]);

    const [topSelling, lowSelling] = await Promise.all([
      Order.aggregate(pipeline(-1)),
      Order.aggregate(pipeline(1))
    ]);

    return {
      topSelling: topSelling[0] || null,
      lowSelling: lowSelling[0] || null
    };
  },
  peakTime: async (adminId) => {
    const id = new mongoose.Types.ObjectId(adminId);

    return Order.aggregate([
      { $match: { adminId: id } },
      { $group: { _id: { $hour: "$createdAt" }, orders: { $sum: 1 } } },
      { $sort: { orders: -1 } }
    ]);
  },
  tablePerformance: async (adminId) => {
    const id = new mongoose.Types.ObjectId(adminId);

    return Order.aggregate([
      { $match: { adminId: id } },
      { $group: { _id: "$tableNumber", income: { $sum: "$totalAmount" } } },
      { $sort: { income: -1 } }
    ]);
  },
};

export default dashboardService;