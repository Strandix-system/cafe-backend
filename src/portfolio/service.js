import Customer from "../../model/customer.js";
import Menu from "../../model/menu.js";
import CustomerFeedback from "../../model/customerFeedback.js";

const MAX_PORTFOLIO_FEEDBACKS = 5;

const normalizeFeedbackIds = (feedbackIds) => {
  if (feedbackIds === undefined || feedbackIds === null) {
    throw Object.assign(new Error("feedbackIds is required"), { statusCode: 400 });
  }

  const ids = Array.isArray(feedbackIds) ? feedbackIds : feedbackIds ? [feedbackIds] : [];
  return [...new Set(ids.map((id) => String(id)))];
};

const portfolioService = {
  aboutStats: async (filter = {}) => {
    const adminId = filter.adminId;

    const [totalCustomer, totalMenuItem] = await Promise.all([
      Customer.countDocuments({ adminId }),
      Menu.countDocuments({ adminId }),
    ]);

    return {
      adminId,
      totalCustomer,
      totalMenuItem,
    };
  },
  createCustomerFeedback: async (body = {}) => {
    const customer = await Customer.findById(body.customerId).select("_id");

    if (!customer) {
      throw Object.assign(new Error("Customer not found"), { statusCode: 404 }); // throe new APIError 
    }

    return await CustomerFeedback.create(body);
  },
  getTopCustomerFeedbacks: async (filter = {}) => {
    const featuredFeedbacks = await CustomerFeedback.find({
      adminId: filter.adminId,
      isPortfolioFeatured: true,
    })
      .populate("customerId", "name phoneNumber")
      .sort({ portfolioSelection: 1, createdAt: -1 })
      .limit(MAX_PORTFOLIO_FEEDBACKS);

    const remainingSlots = MAX_PORTFOLIO_FEEDBACKS - featuredFeedbacks.length;
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
  updatePortfolioFeedbackSelection: async (adminId, feedbackIds) => {
    const newSelectionIds = normalizeFeedbackIds(feedbackIds);

    const currentSelected = await CustomerFeedback.find({
      adminId,
      isPortfolioFeatured: true,
    })
      .sort({ portfolioSelection: 1, createdAt: -1 })
      .select("_id");

    const currentSelectedIds = currentSelected.map((item) => String(item._id));
    const mergedSelectionIds = [...new Set([...currentSelectedIds, ...newSelectionIds])];

    if (newSelectionIds.length > 0) {
      const existingFeedbacks = await CustomerFeedback.find({
        _id: { $in: newSelectionIds },
        adminId,
      }).select("_id");

      if (existingFeedbacks.length !== newSelectionIds.length) {
        throw Object.assign(
          new Error("One or more customer feedbacks were not found for this admin"),
          { statusCode: 404 }
        );
      }
    }

    if (mergedSelectionIds.length > MAX_PORTFOLIO_FEEDBACKS) {
      throw Object.assign(
        new Error(`You can select a maximum of ${MAX_PORTFOLIO_FEEDBACKS} customer feedbacks`),
        { statusCode: 400 }
      );
    }

    await CustomerFeedback.updateMany(
      { adminId },
      {
        $set: {
          isPortfolioFeatured: false,
          portfolioSelection: null,
        },
      }
    );

    if (newSelectionIds.length === 0) {
      return await portfolioService.getTopCustomerFeedbacks({ adminId });
    }

    if (mergedSelectionIds.length > 0) {
      const bulkOperations = mergedSelectionIds.map((feedbackId, index) => ({
        updateOne: {
          filter: { _id: feedbackId, adminId },
          update: {
            $set: {
              isPortfolioFeatured: true,
              portfolioSelection: index + 1,
            },
          },
        },
      }));

      await CustomerFeedback.bulkWrite(bulkOperations);
    }

    return await portfolioService.getTopCustomerFeedbacks({ adminId });
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
      throw Object.assign(new Error("Customer feedback not found"), { statusCode: 404 });
    }
  },
};

export default portfolioService;
