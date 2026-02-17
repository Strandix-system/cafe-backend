import layoutService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";
import { pick } from "../../../utils/pick.js";

const cafeLayoutController = {
  createCafeLayout: async (req, res, next) => {
    try {
      if (typeof req.body.hours === 'string') {
        req.body.hours = JSON.parse(req.body.hours);
      }
      const result = await layoutService.createCafeLayout(
        req.user._id,
        req.body,
        req.files,
        req.user.role // 🔥 pass role
      );
      sendSuccessResponse(res, 201, "Cafe layout created successfully", result);
    } catch (err) {
      next(err);
    }
  },
  updateCafeLayout: async (req, res, next) => {
    try {
      if (typeof req.body.hours === 'string') {
        req.body.hours = JSON.parse(req.body.hours);
      }
      const result = await layoutService.updateCafeLayout(
        req.params.id,
        req.body,
        req.files
      );
      sendSuccessResponse(res, 200, "Cafe layout updated successfully", result);
    } catch (err) {
      next(err);
    }
  },
  updateLayoutStatus: async (req, res, next) => {
    try {
      const result = await layoutService.updateLayoutStatus(
        req.body
      );
      sendSuccessResponse(res, 200, "Cafe layout status updated successfully", result);
    } catch (err) {
      next(err);
    }
  },
  getAllLayout: async (req, res, next) => {
    try {
      const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
      // Hardcode defaultLayout to true to restrict results 
      const filter = {
        ...pick(req.query, ["adminId"]), // keep other allowed filters
        defaultLayout: true
      };
      const layout = await layoutService.getAllLayout(filter, options);
      sendSuccessResponse(res, 200, "Default layouts fetched successfully", layout);
    } catch (err) {
      next(err);
    }
  },
  getLayoutById: async (req, res, next) => {
    try {
      const layout = await layoutService.getLayoutById(req.params.id);
      sendSuccessResponse(res, 200, "Layout fetched by ID", layout);
    } catch (err) {
      next(err);
    }
  },
  getCafeLayoutByAdmin: async (req, res, next) => {
    try {
      const options = pick(req.query, ["page", "limit", "populate"]);
      const filter = pick(req.query, ["adminId", "search", "defaultLayout"]);
      if (filter.defaultLayout) {
        filter.defaultLayout = filter.defaultLayout === "true";
      }
      if (req.user.role === "admin") {
        filter.adminId = req.user._id;
      }
      const result = await layoutService.getCafeLayoutByAdmin(filter, options);
      sendSuccessResponse(res, 200, "Cafe layouts fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },
  deleteCafeLayout: async (req, res, next) => {
    try {
      await layoutService.deleteCafeLayout(req.params.id);

      sendSuccessResponse(res, 200, "Cafe layout deleted successfully");
    } catch (err) {
      next(err);
    }
  },
  getActiveLayout: async (req, res, next) => {
    try {
      const { id } = req.params;
      const layout = await layoutService.getActiveLayout(id);
      sendSuccessResponse(res, 200, "Layout fetched for portfolio successfully", layout);
    } catch (err) {
      next(err);
    }
  },
};

export default cafeLayoutController;