import { portfolioService } from "./service.js";
import { pick } from "../../utils/pick.js";
import { sendSuccessResponse } from "../../utils/response.js";

export const portfolioController = {
  aboutStats: async (req, res) => {
    const filter = pick(req.params, ["adminId"]);
    const data = await portfolioService.aboutStats(filter);
    sendSuccessResponse(res, 200, "About stats fetched", data);
  },
  createCustomerFeedback: async (req, res) => {
    const data = await portfolioService.createCustomerFeedback(req.body);
    sendSuccessResponse(res, 201, "Customer feedback submitted", data);
  },
  getTopCustomerFeedbacks: async (req, res) => {
    const filter = pick(req.params, ["adminId"]);
    const data = await portfolioService.getTopCustomerFeedbacks(filter);
    sendSuccessResponse(res, 200, "Top customer feedback fetched", data);
  },
  updatePortfolioFeedbackSelection: async (req, res) => {
    const data = await portfolioService.updatePortfolioFeedbackSelection(
      req.user._id,
      req.params.feedbackId,
      req.body.isPortfolioFeatured
    );
    sendSuccessResponse(res, 200, "Portfolio feedback selection updated", data);
  },
  getCustomerFeedbacks: async (req, res) => {
    const filter = pick(req.query, ["search"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
    options.populate = "customerId";
    filter.adminId = req.user._id;
    const data = await portfolioService.getCustomerFeedbacks(filter, options);
    sendSuccessResponse(res, 200, "Customer feedback fetched", data);
  },
  deleteCustomerFeedback: async (req, res) => {
    await portfolioService.deleteCustomerFeedback(
      req.params.id,
      req.user._id
    );
    sendSuccessResponse(res, 200, "Customer feedback deleted", null);
  },
};
