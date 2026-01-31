import layoutService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";

export default {
  createTemplate: async (req, res, next) => {
    try {
      const result = await layoutService.createTemplate(req.body);
      sendSuccessResponse(res, 201, "Template created", result);
    } catch (err) {
      next(err);
    }
  },

  createCafeLayout: async (req, res, next) => {
    try {
      const result = await layoutService.createCafeLayout(
        req.user._id,
        req.body,
        req.files
      );
      sendSuccessResponse(res, 201, "Layout saved", result);
    } catch (err) {
      next(err);
    }
  },

  getAdminLayout: async (req, res, next) => {
    try {
      const result = await layoutService.getAdminLayout(req.user._id);
      sendSuccessResponse(res, 200, "Layout fetched", result);
    } catch (err) {
      next(err);
    }
  }
};
