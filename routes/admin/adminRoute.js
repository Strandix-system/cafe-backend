import express from "express";
import controller from "../../src/admin/controller.js";
import { validate } from "../../middleware/validate.js";
import { tokenVerification } from "../../middleware/auth.js";
import { allowRoles } from "../../middleware/permission.js";
import {
  createAdminValidator,
  updateAdminValidator,
  deleteAdminValidator, updateSuperAdmin
} from "../../validations/createValidation.js";
import { uploadAdminImages } from "../../middleware/upload.js";
import { parseJSONFields } from "../../utils/helper.js";
import dashboardController from "../../src/admin/dashboard/controller.js";
import visitController from "../../src/admin/visit/controller.js";
import { portfolioController } from "../../src/portfolio/controller.js";

const router = express.Router();

router.post(
  "/create",
  tokenVerification,
  allowRoles("superadmin"),
  uploadAdminImages.fields([
    { name: "logo", maxCount: 1 },
    { name: "profileImage", maxCount: 1 }
  ]),
  parseJSONFields(["socialLinks", "hours"]),
  validate(createAdminValidator),
  controller.createAdmin
);

router.patch(
  "/update/:id",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  uploadAdminImages.fields([
    { name: "logo", maxCount: 1 },
    { name: "profileImage", maxCount: 1 }
  ]),
  parseJSONFields(["socialLinks", "hours"]),
  validate(updateAdminValidator),
  controller.updateAdmin
);


router.delete(
  "/delete/:id",
  tokenVerification,
  allowRoles("superadmin"),
  validate(deleteAdminValidator),
  controller.deleteAdmin
);

router.get(
  "/get-users",
  tokenVerification,
  allowRoles("superadmin"),
  controller.listAdmins
);

router.get(
  "/get-user/:id",
  tokenVerification,
  allowRoles("superadmin"),
  controller.getByAdmin
);
//only for super admin 
router.patch(
  "/superadmin/:id",
  tokenVerification,
  allowRoles("superadmin"),
  uploadAdminImages.fields([
    { name: "profileImage", maxCount: 1 }
  ]),
  validate(updateSuperAdmin),
  controller.updateSuperAdmin
);

router.patch(
  "/update-status/:id",
  tokenVerification,
  allowRoles("superadmin"),
  controller.updateAdminStatus
);
router.get(
  "/dashboard/stats",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  dashboardController.getStats
);

router.get(
  "/dashboard/sales",
  tokenVerification,
  allowRoles("admin", "superadmin"), dashboardController.getSalesChart
);

router.get(
  "/dashboard/items-performance",
  tokenVerification, allowRoles("admin", "superadmin"),
  dashboardController.getItemPerformance
);

router.get(
  "/dashboard/peak-time",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  dashboardController.getPeakTime
);

router.get(
  "/dashboard/tables",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  dashboardController.getTablePerformance
);
router.get(
  "/dashboard/top-customers",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  dashboardController.getTopCustomers
);
router.get(
  "/dashboard/top-cafes",
  tokenVerification,
  allowRoles("superadmin"),
  dashboardController.getTopCafes
);

router.get(
  "/dashboard/platform-sales",
  tokenVerification,
  allowRoles("superadmin"),
  dashboardController.getPlatformSales
);
router.get(
  "/dashboard/admin-analytics",
  tokenVerification,
  allowRoles("superadmin"),
  dashboardController.getAdminAnalytics
);
router.post("/track", visitController.trackVisit);
router.get("/total",
  tokenVerification,
  allowRoles("superadmin"),
  visitController.getTotalVisits);

router.get(
  "/get-feedback",
  tokenVerification,
  allowRoles("admin"),
  portfolioController.getCustomerFeedbacks
);

router.delete(
  "/delete-feedback/:id",
  tokenVerification,
  allowRoles("admin"),
  portfolioController.deleteCustomerFeedback
);

router.patch(
  "/feedback-selection",
  tokenVerification,
  allowRoles("admin"),
  portfolioController.updatePortfolioFeedbackSelection
);

export default router;
