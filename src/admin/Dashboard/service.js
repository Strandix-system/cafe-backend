import User from "../../../model/user.js";
import Order from "../../../model/order.js";
import Customer from "../../../model/customer.js";

const dashboardService = {

  superAdminStats: async () => {
    const totalCafe = await User.countDocuments({
      role: "admin",
    });

    const totalActive = await User.countDocuments({
      role: "admin",
      isActive: true,
    });

    const totalInActive = await User.countDocuments({
      role: "admin",
      isActive: false,
    });

    const incomeData = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalIncome = incomeData[0]?.total || 0;

    return {
      totalCafe,
      totalActive,
      totalInActive,
      totalIncome,
    };
  },

  adminStats: async (adminId) => {

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const totalCustomer = await Customer.countDocuments({
      adminId,
    });

    const totalOrder = await Order.countDocuments({
      adminId,
    });

    const totalIncomeData = await Order.aggregate([
      {
        $match: { adminId },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalIncome = totalIncomeData[0]?.total || 0;

    const todayCustomer = await Customer.countDocuments({
      adminId,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    });

    const todayOrder = await Order.countDocuments({
      adminId,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    });

    const todayIncomeData = await Order.aggregate([
      {
        $match: {
          adminId,
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    const todayIncome = todayIncomeData[0]?.total || 0;


    return {
      totalCustomer,
      totalOrder,
      totalIncome,
      todayCustomer,
      todayOrder,
      todayIncome,
    };
  },

};

export default dashboardService;
