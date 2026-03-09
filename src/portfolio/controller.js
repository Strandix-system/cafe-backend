import portfolioService from "./service.js";
import { pick } from "../../utils/pick.js";
import { sendSuccessResponse } from "../../utils/response.js";

export const portfolioController = {
  aboutStats: async (req, res, next) => {
    try {
      const filter = pick(req.params, ["adminId"]);
      const data = await portfolioService.aboutStats(filter);
      sendSuccessResponse(res, 200, "About stats fetched", data);
    } catch (err) {
      next(err);
    }
  },
  createCustomerFeedback: async (req, res, next) => {
    try {
      const data = await portfolioService.createCustomerFeedback(req.body);
      sendSuccessResponse(res, 201, "Customer feedback submitted", data);
    } catch (err) {
      next(err);
    }
  },
  getTopCustomerFeedbacks: async (req, res, next) => {
    try {
      const filter = pick(req.params, ["adminId"]);
      const data = await portfolioService.getTopCustomerFeedbacks(filter);
      sendSuccessResponse(res, 200, "Top customer feedback fetched", data);
    } catch (err) {
      next(err);
    }
  },
  updatePortfolioFeedbackSelection: async (req, res, next) => {
    try {
      const data = await portfolioService.updatePortfolioFeedbackSelection(
        req.user._id,
        req.body.feedbackIds
      );
      sendSuccessResponse(res, 200, "Portfolio feedback selection updated", data);
    } catch (err) {
      next(err);
    }
  },
  getCustomerFeedbacks: async (req, res, next) => {
    try {
      const filter = pick(req.query, ["search"]);
      const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
      options.populate = "customerId";
      filter.adminId = req.user._id;
      const data = await portfolioService.getCustomerFeedbacks(filter, options);
      sendSuccessResponse(res, 200, "Customer feedback fetched", data);
    } catch (err) {
      next(err);
    }
  },
  deleteCustomerFeedback: async (req, res, next) => {
    try {
      await portfolioService.deleteCustomerFeedback(
        req.params.id,
        req.user._id
      );
      sendSuccessResponse(res, 200, "Customer feedback deleted", null);
    } catch (err) {
      next(err);
    }
  },
};
