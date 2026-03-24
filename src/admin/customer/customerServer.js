import Customer from "../../../model/customer.js";
import mongoose from "mongoose";
import { ApiError } from "../../../utils/apiError.js";

const customerService = {
  createCustomer: async (body) => {
    const { name, phoneNumber, adminId } = body;

    let customer = await Customer.findOne({
      phoneNumber,
      adminId,
    });

    if (customer) {
      customer.name = name;
      await customer.save();
      return customer;
    }

    const newCustomer = await Customer.create({
      name,
      phoneNumber,
      adminId,
    });

    return newCustomer.toObject();
  },
  getCustomers: async (filter, options, user) => {
    let adminId = user.role === "admin" ? user._id : filter.adminId;

    if (user.role === "superadmin" && !filter.adminId) {
      throw new ApiError(400, "adminId is required to view customers");
    }

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new ApiError(400, "Invalid adminId");
    }

    adminId = new mongoose.Types.ObjectId(adminId);

    const page = Number(options.page) || 0;
    const limit = Number(options.limit) || 10;
    const skip = page * limit;

    const matchStage = { adminId };

    if (filter.search) {
      matchStage.$or = [
        { name: { $regex: filter.search, $options: "i" } },
        { phoneNumber: { $regex: filter.search, $options: "i" } },
      ];
    }

    const statusFilter = String(filter.status || "").toLowerCase();
    const allowedStatuses = ["new", "frequent", "vip"];

    if (statusFilter && !allowedStatuses.includes(statusFilter)) {
      throw new ApiError(400, "Invalid status. Allowed: new, frequent, vip");
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "orderitems",
          let: { customerId: "$_id", adminId: "$adminId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$customerId", "$$customerId"] },
              },
            },
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
                $expr: {
                  $and: [
                    { $eq: ["$order.adminId", "$$adminId"] },
                    { $eq: ["$order.isCompleted", true] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$orderId",
                totalAmount: { $first: "$order.totalAmount" },
                createdAt: { $first: "$order.createdAt" },
              },
            },
          ],
          as: "orderStats",
        },
      },
      {
        $addFields: {
          totalOrder: { $size: "$orderStats" },
          totalSpent: { $sum: "$orderStats.totalAmount" },
          lastVisitDate: { $max: "$orderStats.createdAt" },
        },
      },
      {
        $addFields: {
          customerStatus: {
            $switch: {
              branches: [
                { case: { $gt: ["$totalSpent", 5000] }, then: "vip" },
                { case: { $gt: ["$totalOrder", 1] }, then: "frequent" },
              ],
              default: "new",
            },
          },
        },
      },
      {
        $lookup: {
          from: "orderitems",
          let: { customerId: "$_id", adminId: "$adminId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$customerId", "$$customerId"] },
              },
            },
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
                $expr: {
                  $and: [
                    { $eq: ["$order.adminId", "$$adminId"] },
                    { $eq: ["$order.isCompleted", true] },
                  ],
                },
              },
            },
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
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 1 },
          ],
          as: "favoriteItemAgg",
        },
      },
      {
        $addFields: {
          favoriteItem: { $arrayElemAt: ["$favoriteItemAgg._id", 0] },
        },
      },
    ];

    if (statusFilter) {
      pipeline.push({ $match: { customerStatus: statusFilter } });
    }

    pipeline.push(
      { $project: { orderStats: 0, favoriteItemAgg: 0 } },
      {
        $facet: {
          metadata: [{ $count: "totalResults" }],
          data: [{ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: limit }],
        },
      }
    );

    const result = await Customer.aggregate(pipeline);
    const customers = result[0]?.data || [];
    const totalResults = result[0]?.metadata?.[0]?.totalResults || 0;

    return {
      results: customers,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(totalResults / limit) : 0,
      totalResults,
    };
  },

  getCustomerById: async (id) => {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }
    return customer;
  },

  updateCustomer: async (id, data) => {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    Object.assign(customer, data);
    await customer.save();
    return customer;
  },

  deleteCustomer: async (id) => {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    await customer.deleteOne();
    return true;
  },
};

export default customerService;
