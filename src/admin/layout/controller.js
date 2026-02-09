import layoutService from "./service.js";
import { sendSuccessResponse } from "../../../utils/response.js";
import { pick } from "../../../utils/pick.js";
import { get } from "http";

const cafeLayoutController = {
  // ✅ CREATE (Admin / Superadmin)
 createCafeLayout: async (req, res, next) => {
  try {
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

  // ✅ UPDATE
  updateCafeLayout: async (req, res, next) => {
    try {
      const result = await layoutService.updateCafeLayout(
        req.params.id,
        req.body,      // supports partial update for hours & socialLinks
        req.files
      );

      sendSuccessResponse(res, 200, "Cafe layout updated successfully", result);
    } catch (err) {
      next(err);
    }
  },
  getAllLayout: async (req, res, next) => {
    try {
      const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
      const filter = pick(req.query, ["adminId", "search", "defaultLayout"]);

      const layout = await layoutService.getAllLayout(filter, options);

      sendSuccessResponse(res, 200, "Layout fetched by ID", layout);
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
  // ✅ GET ALL (S Admin listing)
  getAllCafeLayout: async (req, res, next) => {
    try {
      const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
      const filter = pick(req.query, ["adminId", "search", "defaultLayout"]);

      if (filter.defaultLayout) {
        filter.defaultLayout = filter.defaultLayout === "true";
      }

      if (req.user.role === "admin") {
        filter.adminId = req.user._id;
      }
      const result = await layoutService.getAllCafeLayouts(filter, options);
      sendSuccessResponse(res, 200, "Cafe layouts fetched successfully", result);
    } catch (error) {
      next(error);
    }
  },

  // ✅ GET OWN LAYOUT (Admin)
  // getCafeLayout: async (req, res, next) => {
  //   try {
  //     const result = await layoutService.getCafeLayout(req.user._id);

  //     sendSuccessResponse(res, 200, "Cafe layout fetched successfully", result);
  //   } catch (err) {
  //     next(err);
  //   }
  // },

  // ✅ DELETE
  deleteCafeLayout: async (req, res, next) => {
    try {
      await layoutService.deleteCafeLayout(req.params.id);

      sendSuccessResponse(res, 200, "Cafe layout deleted successfully");
    } catch (err) {
      next(err);
    }
  },

  // ✅ ADMIN DASHBOARD (Own layout OR default)
  getLayoutForAdminDashboard: async (req, res, next) => {
    try {
      let layout = await layoutService.getCafeLayout(req.user._id);

      if (!layout) {
        layout = await layoutService.getDefaultLayout();
      }

      sendSuccessResponse(res, 200, "Layout fetched for admin dashboard", layout);
    } catch (err) {
      next(err);
    }
  },

  // 🌐 PUBLIC PORTFOLIO (NO LOGIN)
  getLayoutForPortfolio: async (req, res, next) => {
    try {
      const { id } = req.params;

      // let layout = await layoutService.getCafeLayout(adminId);
      const layout = await layoutService.getDefaultLayout(id);
      res.status(200).json({
        success: true,
        message: "Cafe portfolio layout fetched successfully",
        result: layout,
      });
    } catch (err) {
      next(err);
    }
  },
  // // 🌐 PREVIEW LAYOUT
  // previewToken: async (req, res, next) => {
  //   try {
  //     const result = await layoutService.previewToken(req.params.id);
  //     sendSuccessResponse(res, 200, "Preview layout fetched successfully", result);
  //   } catch (err) {
  //     next(err);
  //   }
  // },
  // 🔐 GENERATE PREVIEW TOKEN (SUPERADMIN ONLY)
  // generatePreviewTokenForDefault: async (req, res, next) => {
  //   try {
  //     const result = await layoutService.generatePreviewTokenForDefault();

  //     sendSuccessResponse(
  //       res,
  //       200,
  //       "Preview token generated for default layout",
  //       result
  //     );
  //   } catch (err) {
  //     next(err);
  //   }
  // },

  // // 🌐 PREVIEW USING TOKEN (NO LOGIN)
  // previewByToken: async (req, res, next) => {
  //   try {
  //     const { token } = req.params;

  //     if (!token) {
  //       return next(new ApiError(400, "Preview token is required"));
  //     }

  //     const result = await layoutService.getLayoutByPreviewToken(token);

  //     sendSuccessResponse(
  //       res,
  //       200,
  //       "Preview layout fetched successfully",
  //       result
  //     );
  //   } catch (err) {
  //     next(err);
  //   }
  // },
};

export default cafeLayoutController;