import layoutService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";

const cafeLayoutController = {
  // ✅ CREATE
  createCafeLayout: async (req, res, next) => {
    try {
      const result = await layoutService.createCafeLayout(
        req.user._id,
        req.body,
        req.files
      );

      sendSuccessResponse(res, 201, "Cafe layout created successfully", result);
    } catch (err) {
      next(err);
    }
  },

  // ✅ UPDATE
  updateCafeLayout: async (req, res, next) => {
    try {
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

  // ✅ GET
  getCafeLayout: async (req, res, next) => {
    try {
      const result = await layoutService.getCafeLayout(req.user._id);
      sendSuccessResponse(res, 200, "Cafe layout fetched successfully", result);
    } catch (err) {
      next(err);
    }
  },

  // ✅ DELETE
  deleteCafeLayout: async (req, res, next) => {
    try {
      await layoutService.deleteCafeLayout(req.params.id);
      sendSuccessResponse(res, 200, "Cafe layout deleted successfully");
    } catch (err) {
      next(err);
    }
  },
  // ✅ ADMIN DASHBOARD LOAD
// If admin layout exists → return it
// Else → return default layout
getLayoutForAdminDashboard: async (req, res, next) => {
  try {
    let layout = await layoutService.getCafeLayout(req.user._id);

    if (!layout) {
      layout = await layoutService.getDefaultLayout();
    }

    sendSuccessResponse(
      res,
      200,
      "Layout fetched for admin dashboard",
      layout
    );
  } catch (err) {
    next(err);
  }
},

};

export default cafeLayoutController;
