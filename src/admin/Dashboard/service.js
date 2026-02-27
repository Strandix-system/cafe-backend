import mongoose from "mongoose";
import User from "../../../model/user.js";
import Order from "../../../model/order.js";
import Customer from "../../../model/customer.js";
import demoRequest from "../../../model/demoRequest.js";

const dashboardService = {
  superAdminStats: async () => {
    const [totalCafe, totalActive, totalInActive, totalDemoRequest, incomeAgg] =
      await Promise.all([
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "admin", isActive: true }),
        User.countDocuments({ role: "admin", isActive: false }),
        demoRequest.countDocuments(),
        Order.aggregate([
          { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ])
      ]);

    return {
      totalCafe,
      totalActive,
      totalInActive,
      totalDemoRequest,
      totalIncome: incomeAgg[0]?.total || 0,
    };
  },
  adminStats: async (adminId) => {
    const id = adminId;
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
  salesChart: async (adminId, startDate, endDate) => {
    const id = adminId;
    let start, end, groupId, labelFormatter;

    // ✅ DEFAULT: YEARLY (current year, month-wise)
    if (!startDate || !endDate) {
      const now = new Date();

      start = new Date(now.getFullYear(), 0, 1); // Jan 1
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999); // Dec 31

      groupId = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };

      labelFormatter = (id) => `${id.month}-${id.year}`;
    }
    // ✅ Custom date range
    else {
      // 🔥 FIX START
      start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);

      end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      // 🔥 FIX END

      const diffDays = Math.ceil(
        (end - start) / (1000 * 60 * 60 * 24)
      );

      // Day-wise (short range)
      if (diffDays <= 45) {
        groupId = {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        };

        labelFormatter = (id) => id.date;
      }
      // Month-wise (long range)
      else {
        groupId = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };

        labelFormatter = (id) => `${id.month}-${id.year}`;
      }
    }

    const sales = await Order.aggregate([
      {
        $match: {
          adminId: id,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: groupId,
          total: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.date": 1 } },
    ]);

    return sales.map((s) => ({
      label: labelFormatter(s._id),
      total: s.total,
    }));
  },
  itemPerformance: async (adminId) => {
    const id = adminId;

    const pipeline = (sortOrder) => [
      { $match: { adminId: id } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          quantity: { $sum: "$items.quantity" },
          revenue: {
            $sum: {
              $multiply: ["$items.quantity", "$items.price"],
            },
          },
        },
      },
      { $sort: { revenue: sortOrder } },
      { $limit: 1 },
      {
        $lookup: {
          from: "menus",
          localField: "_id",
          foreignField: "name",
          as: "menu",
        },
      },
      { $unwind: { path: "$menu", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          name: "$_id",
          quantity: 1,
          revenue: 1,
          image: "$menu.image",
        },
      },
    ];

    const [topSelling, lowSelling] = await Promise.all([
      Order.aggregate(pipeline(-1)), // highest revenue
      Order.aggregate(pipeline(1)),  // lowest revenue
    ]);

    return {
      topSelling: topSelling[0] || null,
      lowSelling: lowSelling[0] || null,
    };
  },
  peakTime: async (adminId, startDate, endDate) => {
    const id = adminId;

    let start, end;

    if (!startDate || !endDate) {
      const now = new Date();

      start = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0, 0
      ));

      end = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23, 59, 59, 999
      ));
    } else {
      // 🔥 FIX START
      start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);

      end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      // 🔥 FIX END
    }
    const raw = await Order.aggregate([
      {
        $match: {
          adminId: id,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $hour: {
              date: "$createdAt",
              timezone: "Asia/Kolkata"
            }
          },
          orders: { $sum: 1 },
        },
      },
    ]);

    const hourMap = {};
    raw.forEach(r => (hourMap[r._id] = r.orders));

    const result = [];
    for (let hour = 8; hour <= 24; hour++) {
      result.push({
        hour:
          hour === 12
            ? "12 PM"
            : hour < 12
              ? `${hour} AM`
              : `${hour - 12} PM`,
        orders: hourMap[hour] || 0,
      });
    }

    return result;
  },
  topCustomers: async (adminId) => {
    const id = adminId;

    const customers = await Order.aggregate([
      {
        $match: {
          adminId: id,
          orderStatus: "completed",
        },
      },
      {
        $group: {
          _id: "$userId",
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          name: "$customer.name",
          totalOrders: 1,
          totalAmount: 1,
        },
      },
      {
        $sort: {
          totalOrders: -1,
          totalAmount: -1,
        },
      },
      { $limit: 10 },
    ]);

    return customers;
  },
  tablePerformance: async (adminId) => {
    const id = adminId;

    return Order.aggregate([
      { $match: { adminId: id } },
      {
        $group: {
          _id: "$tableNumber",
          totalOrders: { $sum: 1 }
        }
      },
      { $sort: { totalOrders: -1 } }

    ]);
  },
 platformSales: async (startDate, endDate) => {
    let start, end, groupId, labelFormatter;

    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    if (!startDate || !endDate) {
      const now = new Date();

      start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));

      groupId = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };

      labelFormatter = (id) => `${months[id.month - 1]}-${String(id.year).slice(-2)}`;
    }

    else {
      start = new Date(startDate);
      start.setUTCHours(0, 0, 0, 0);

      end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);

      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      if (diffDays <= 45) {
        groupId = {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
        };

        labelFormatter = (id) => {
          const [year, month, day] = id.date.split("-");
          return `${day}-${months[Number(month) - 1]}-${year}`;
        };
      }
    
      else {
        groupId = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };

        labelFormatter = (id) => `${months[id.month - 1]}-${String(id.year).slice(-2)}`;
      }
    }

    const chartAgg = await Order.aggregate([
      {
        $match: {
          orderStatus: "completed",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: groupId,
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.date": 1 } },
    ]);

    return chartAgg.map((c) => ({
      label: labelFormatter(c._id),
      orders: c.orders,
      revenue: c.revenue,
    }));
  },
  topCafes: async () => {
    const cafes = await Order.aggregate([
      {
        $match: {
          orderStatus: "completed",
        },
      },
      {
        $group: {
          _id: "$adminId",
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "admin",
        },
      },
      { $unwind: "$admin" },
      {
        $project: {
          _id: 0,
          cafeId: "$admin._id",
          cafeName: "$admin.cafeName", // ✅ FIX HERE
          totalOrders: 1,
          totalAmount: 1,
        },
      },
      {
        $sort: {
          totalOrders: -1,
          totalAmount: -1,
        },
      },
      { $limit: 5 },
    ]);

    return cafes;
  },
};

export default dashboardService;