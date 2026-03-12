import express from "express";
import { adminController } from "../../src/admin/controller.js";
import { validate } from "../../middleware/validate.js";
import { tokenVerification } from "../../middleware/auth.js";
import { allowRoles } from "../../middleware/permission.js";
import {
  createAdminValidator,
  updateAdminValidator,
  deleteAdminValidator,
  updateSuperAdmin,
  updateAdminStatusValidator
} from "../../validations/createValidation.js";
import { uploadAdminImages } from "../../middleware/upload.js";
import { parseJSONFields } from "../../utils/helper.js";
import dashboardController from "../../src/admin/Dashboard/controller.js";
import { visitController } from "../../src/admin/visit/controller.js";
import { blockExpiredSubscription } from "../../middleware/block.Expired.Subscription.js";
import { portfolioController } from "../../src/portfolio/controller.js";
import { updateFeedbackValidator } from "../../validations/portfolio.validation.js";

export const adminRoute = express.Router();

adminRoute.post(
  "/create",
  tokenVerification,
  allowRoles("superadmin"),
  uploadAdminImages.fields([
    { name: "logo", maxCount: 1 },
    { name: "profileImage", maxCount: 1 }
  ]),
  parseJSONFields(["socialLinks", "hours"]),
  validate(createAdminValidator),
  adminController.createAdmin
);

adminRoute.patch(
  "/update/:id",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  uploadAdminImages.fields([
    { name: "logo", maxCount: 1 },
    { name: "profileImage", maxCount: 1 }
  ]),
  parseJSONFields(["socialLinks", "hours"]),
  validate(updateAdminValidator),
  adminController.updateAdmin
);


adminRoute.delete(
  "/delete/:id",
  tokenVerification,
  allowRoles("superadmin"),
  validate(deleteAdminValidator),
  adminController.deleteAdmin
);

adminRoute.get(
  "/get-users",
  tokenVerification,
  allowRoles("superadmin"),
  adminController.listAdmins
);

adminRoute.get(
  "/get-user/:id",
  tokenVerification,
  allowRoles("superadmin"),
  validate(deleteAdminValidator),
  adminController.getByAdmin
);

adminRoute.patch(
  "/superadmin/:id",
  tokenVerification,
  allowRoles("superadmin"),
  uploadAdminImages.fields([
    { name: "profileImage", maxCount: 1 }
  ]),
  validate(updateSuperAdmin),
  adminController.updateSuperAdmin
);

adminRoute.patch(
  "/update-status/:id",
  tokenVerification,
  allowRoles("superadmin"),
  validate(updateAdminStatusValidator),
  adminController.updateAdminStatus
);
adminRoute.get(
  "/dashboard/stats",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  blockExpiredSubscription,
  dashboardController.getStats
);

adminRoute.get(
  "/dashboard/sales",
  tokenVerification,
  allowRoles("admin", "superadmin"), blockExpiredSubscription, dashboardController.getSalesChart
);

adminRoute.get(
  "/dashboard/items-performance",
  tokenVerification, allowRoles("admin", "superadmin"), blockExpiredSubscription,
  dashboardController.getItemPerformance
);

adminRoute.get(
  "/dashboard/peak-time",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  blockExpiredSubscription,
  dashboardController.getPeakTime
);

adminRoute.get(
  "/dashboard/tables",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  dashboardController.getTablePerformance
);
adminRoute.get(
  "/dashboard/top-customers",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  blockExpiredSubscription,
  dashboardController.getTopCustomers
);
adminRoute.get(
  "/dashboard/top-cafes",
  tokenVerification,
  allowRoles("superadmin"),
  dashboardController.getTopCafes
);

adminRoute.get(
  "/dashboard/platform-sales",
  tokenVerification,
  allowRoles("superadmin"),
  dashboardController.getPlatformSales
);
adminRoute.get(
  "/dashboard/admin-analytics",
  tokenVerification,
  allowRoles("superadmin"),
  dashboardController.getAdminAnalytics
);
adminRoute.post("/track", visitController.trackVisit);
adminRoute.get("/total",
  tokenVerification,
  allowRoles("superadmin"),
  visitController.getTotalVisits
);
adminRoute.get(
  "/get-feedback",
  tokenVerification,
  allowRoles("admin"),
  portfolioController.getCustomerFeedbacks
);
adminRoute.delete(
  "/delete-feedback/:id",
  tokenVerification,
  allowRoles("admin"),
  portfolioController.deleteCustomerFeedback
);
adminRoute.patch(
  "/feedback-selection/:feedbackId",
  tokenVerification,
  allowRoles("admin"),
  validate(updateFeedbackValidator),
  portfolioController.updateFeedback
);

