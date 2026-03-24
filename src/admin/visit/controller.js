import visitService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";

const visitController = {
  trackVisit: async (req, res, next) => {
    try {
      await visitService.trackVisit(req);
      sendSuccessResponse(res, 200, "Visit tracked successfully");
    } catch (error) {
      next(error);
    }
  },

  getTotalVisits: async (req, res, next) => {
    try {
      const total = await visitService.getTotalVisits();
      sendSuccessResponse(res, 200, "Total visits fetched", { totalVisits: total });
    } catch (error) {
      next(error);
    }
  },
};

export default visitController;
