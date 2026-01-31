import layoutService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";
import { pick } from "../../../utils/pick.js";

export default {
  createLayout: async (req, res, next) => {
    try {
      const result = await layoutService.createLayout(req.body, req.files || [], req.user);
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
  },
   getAllLayoutTemplates: async (req, res, next) => {
    try {
      const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);
      const result = await layoutService.getAllTemplates(options, req.query);

      sendSuccessResponse(res, 200, "Layout templates fetched successfully", result);
    } catch (error) {
      next(error);
    }
  }
};
