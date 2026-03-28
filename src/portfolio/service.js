import mongoose from "mongoose";
import Customer from "../../model/customer.js";
import Menu from "../../model/menu.js";
import { CustomerFeedback } from "../../model/customerFeedback.js";
import { ApiError } from "../../utils/apiError.js";

export const portfolioService = {
  aboutStats: async (filter = {}) => {
    const adminId = filter.adminId;
    const adminObjectId = new mongoose.Types.ObjectId(adminId);

    const [totalCustomer, totalMenuItem, ratingAgg] = await Promise.all([
      Customer.countDocuments({ adminId }),
      Menu.countDocuments({ adminId }),
      CustomerFeedback.aggregate([
        {
          $match: { adminId: adminObjectId },
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rate" },
          },
        },
      ]),
    ]);

    return {
      adminId,
      totalCustomer,
      totalMenuItem,
      averageRating: ratingAgg[0]?.averageRating
        ? Number(ratingAgg[0].averageRating.toFixed(1))
        : 0,
    };
  },
  createCustomerFeedback: async (body = {}) => {
    const customer = await Customer.findById(body.customerId).select("_id adminId");

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    const customerAdminId = customer.adminId;
    const adminId = body.adminId;

    if (!customerAdminId || !adminId) {
      throw new ApiError(400, "adminId is required");
    }

    if (customerAdminId !== adminId) {
      throw new ApiError(400, "customerId does not belong to this admin");
    }

    return await CustomerFeedback.create({
      ...body,
      adminId,
    });
  },
  getTopCustomerFeedbacks: async (filter = {}) => {
    const featuredFeedbacks = await CustomerFeedback.find({
      adminId: filter.adminId,
      isPortfolioFeatured: true,
    })
      .populate("customerId", "name phoneNumber")
      .sort({ createdAt: -1 })
      .limit(5);

    const remainingSlots = 5 - featuredFeedbacks.length;
    if (remainingSlots <= 0) {
      return featuredFeedbacks;
    }

    const featuredIds = featuredFeedbacks.map((feedback) => feedback._id);
    const fallbackFeedbacks = await CustomerFeedback.find({
      adminId: filter.adminId,
      _id: { $nin: featuredIds },
    })
      .populate("customerId", "name phoneNumber")
      .sort({ rate: -1, createdAt: -1 })
      .limit(remainingSlots);

    return [...featuredFeedbacks, ...fallbackFeedbacks];
  },
  updateFeedback: async (adminId, feedbackId, body) => {
    const feedback = await CustomerFeedback.findOne({
      _id: feedbackId,
      adminId,
    });

    if (!feedback) throw new ApiError(404, "Customer feedback not found");

    if (body.isPortfolioFeatured === true) {
      const selectedCount = await CustomerFeedback.countDocuments({
        adminId,
        isPortfolioFeatured: true,
      });

      if (selectedCount >= 5 && !feedback.isPortfolioFeatured) {
        throw new ApiError(400, "You can select a maximum of 5 customer feedbacks");
      }
    }

    Object.assign(feedback, body);
    await feedback.save();

    return feedback;
  },
  getCustomerFeedbacks: async (filter = {}, options = {}) => {
    if (filter.search) {
      const matchedCustomers = await Customer.find({
        $or: [
          { name: { $regex: filter.search, $options: "i" } },
          { phoneNumber: { $regex: filter.search, $options: "i" } },
        ],
      }).select("_id");

      filter.$or = [
        { description: { $regex: filter.search, $options: "i" } },
        { customerId: { $in: matchedCustomers.map((customer) => customer._id) } },
      ];
    }
    delete filter.search;

    return await CustomerFeedback.paginate(filter, options);
  },
  deleteCustomerFeedback: async (feedbackId, adminId) => {
    const feedback = await CustomerFeedback.findOneAndDelete({
      _id: feedbackId,
      adminId,
    });

    if (!feedback) {
      throw new ApiError(404, "Customer feedback not found");
    }
  },
};
