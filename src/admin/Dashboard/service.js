import User from "../../../model/user.js";
import Order from "../../../model/order.js";
import OrderItem from "../../../model/orderItem.js";
import Customer from "../../../model/customer.js";
import demoRequest from "../../../model/demoRequest.js";
import { ApiError } from "../../../utils/apiError.js";
import {
  getCurrentUtcDayRange,
  getCurrentUtcYearRange,
  getUtcDateRange,
} from "../../../utils/dateRange.js";

export const dashboardService = {
  resolveDashboardAdminId: async (user, requestedAdminId, { requireForSuperadmin = false } = {}) => {
    if (user.role === "admin") {
      return user._id;
    }

    if (user.role !== "superadmin") {
      throw new ApiError(403, "Access Denied");
    }

    if (!requestedAdminId) {
      if (requireForSuperadmin) {
        throw new ApiError(400, "adminId query parameter is required");
      }
      return null;
    }

    const admin = await User.findOne({ _id: requestedAdminId, role: "admin" }).select("_id");
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    return admin._id;
  },
  superAdminStats: async () => {
    const [totalCafe, totalActive, totalInActive, totalDemoRequest, incomeAgg] =
      await Promise.all([
        User.countDocuments({ role: "admin" }),
        User.countDocuments({ role: "admin", isActive: true }),
        User.countDocuments({ role: "admin", isActive: false }),
        demoRequest.countDocuments(),
        Order.aggregate([
          {
            $match: { isCompleted: true }
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalAmount" }
            }
          }
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
    const { start, end } = getCurrentUtcDayRange();

    const [
      totalCustomer,
      totalOrder,
      totalIncomeAgg,

      todayCustomerAgg,
      todayOrder,
      todayIncomeAgg,
    ] = await Promise.all([

      Customer.countDocuments({ adminId }),
      Order.countDocuments({
        adminId, isCompleted: true
      }),
      Order.aggregate([
        { $match: { adminId, isCompleted: true } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),

      OrderItem.aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order",
          },
        },
        { $unwind: "$order" },
        {
          $match: {
            "order.adminId": adminId,
            "order.createdAt": { $gte: start, $lte: end },
          },
        },
        { $group: { _id: "$customerId" } },
      ]),
      Order.countDocuments({
        adminId,
        isCompleted: true,
        createdAt: { $gte: start, $lte: end }
      }),
      Order.aggregate([
        {
          $match: {
            adminId,
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
    let start, end, groupId, labelFormatter;

    if (!startDate || !endDate) {
      ({ start, end } = getCurrentUtcYearRange());

      groupId = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };

      labelFormatter = (id) => `${id.month}-${id.year}`;
    }
    else {
      ({ start, end } = getUtcDateRange(startDate, endDate));

      const diffDays = Math.ceil(
        (end - start) / (1000 * 60 * 60 * 24)
      );

      if (diffDays <= 45) {
        groupId = {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
        };

        labelFormatter = (id) => id.date;
      }
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
          adminId,
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
    const pipeline = (sortOrder) => [
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      { $match: { "order.adminId": adminId } },
      {
        $lookup: {
          from: "menus",
          localField: "menuId",
          foreignField: "_id",
          as: "menu",
        },
      },
      { $unwind: { path: "$menu", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$menu.name",
          quantity: { $sum: "$quantity" },
          revenue: {
            $sum: {
              $multiply: [
                "$quantity",
                {
                  $cond: [
                    { $gt: ["$menu.discountPrice", 0] },
                    "$menu.discountPrice",
                    "$menu.price",
                  ],
                },
              ],
            },
          },
          menuImage: { $first: "$menu.image" },
        },
      },
      { $sort: { revenue: sortOrder } },
      { $limit: 1 },
      {
        $project: {
          _id: 0,
          name: "$_id",
          quantity: 1,
          revenue: 1,
          image: "$menuImage",
        },
      },
    ];

    const [topSelling, lowSelling] = await Promise.all([
      OrderItem.aggregate(pipeline(-1)), // highest revenue
      OrderItem.aggregate(pipeline(1)),  // lowest revenue
    ]);

    return {
      topSelling: topSelling[0] || null,
      lowSelling: lowSelling[0] || null,
    };
  },
  peakTime: async (adminId, startDate, endDate) => {
    let start, end;

    if (!startDate || !endDate) {
      ({ start, end } = getCurrentUtcDayRange());
    } else {
      // 🔥 FIX START
      ({ start, end } = getUtcDateRange(startDate, endDate));
      // 🔥 FIX END
    }
    const raw = await Order.aggregate([
      {
        $match: {
          adminId,
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
    for (let hour = 8; hour <= 23; hour++) {
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
  topCustomers: async (adminId, filter = {}) => {
    const sortBy = filter.sortBy;

    let sortStage = {
      totalOrders: -1,
      totalAmount: -1,
    };

    if (sortBy === "amount") {
      sortStage = {
        totalAmount: -1,
        totalOrders: -1,
      };
    }

    const customers = await OrderItem.aggregate([
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      {
        $match: {
          "order.adminId": adminId,
          "order.isCompleted": true,
        },
      },
      {
        $group: {
          _id: { customerId: "$customerId", orderId: "$orderId" },
          totalAmount: { $first: "$order.totalAmount" },
        },
      },
      {
        $group: {
          _id: "$_id.customerId",
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
        $addFields: {
          customerStatus: {
            $switch: {
              branches: [
                { case: { $gt: ["$totalAmount", 5000] }, then: "vip" },
                { case: { $gt: ["$totalOrders", 1] }, then: "frequent" },
              ],
              default: "new",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          name: "$customer.name",
          phoneNumber: "$customer.phoneNumber",
          totalOrders: 1,
          totalAmount: 1,
          customerStatus: 1,
        },
      },
      { $sort: sortStage },
      { $limit: 10 },
    ]);

    return customers;
  },
  tablePerformance: async (adminId) => {
    return Order.aggregate([
      { $match: { adminId } },
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
      ({ start, end } = getCurrentUtcYearRange());

      groupId = {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      };

      labelFormatter = (id) => `${months[id.month - 1]}-${String(id.year).slice(-2)}`;
    }

    else {
      ({ start, end } = getUtcDateRange(startDate, endDate));

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
          isCompleted: true,
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
  topCafes: async (filter = {}) => {
    const sortBy = filter.sortBy;

    let sortStage = {
      totalOrders: -1,
      totalAmount: -1,
    };

    if (sortBy === "amount") {
      sortStage = {
        totalAmount: -1,
        totalOrders: -1,
      };
    }

    if (sortBy === "rating") {
      sortStage = {
        averageRating: -1,
        totalOrders: -1,
        totalAmount: -1,
      };
    }

    const cafes = await Order.aggregate([
      {
        $match: {
          isCompleted: true,
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
        $lookup: {
          from: "customerfeedbacks",
          localField: "_id",
          foreignField: "adminId",
          as: "feedbacks",
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: [
              { $gt: [{ $size: "$feedbacks" }, 0] },
              { $avg: "$feedbacks.rate" },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          cafeId: "$admin._id",
          cafeName: "$admin.cafeName", // ✅ FIX HERE
          totalOrders: 1,
          totalAmount: 1,
          averageRating: { $round: ["$averageRating", 1] },
        },
      },
      {
        $sort: sortStage,
      },
      { $limit: 5 },
    ]);

    return cafes;
  },
};
