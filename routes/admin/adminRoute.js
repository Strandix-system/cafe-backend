import express from "express";
import controller from "../../src/admin/controller.js";
import { validate } from "../../middleware/validate.js";
import { tokenVerification } from "../../middleware/auth.js";
import { allowRoles } from "../../middleware/permission.js";
import {
  createAdminValidator,
  updateAdminValidator,
  deleteAdminValidator
} from "../../validations/createValidation.js";
import { uploadAdminImages } from "../../middleware/upload.js";
import { parseJSONFields } from "../../utils/helper.js";
import dashboardController from "../../src/admin/Dashboard/controller.js";

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
  allowRoles("superadmin","admin"),
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
  allowRoles("admin"), dashboardController.getSalesChart
);

router.get(
  "/dashboard/items-performance",
  tokenVerification, allowRoles("admin"),
  dashboardController.getItemPerformance
);

router.get(
  "/dashboard/peak-time",
  tokenVerification,
  allowRoles("admin"),
  dashboardController.getPeakTime
);

router.get(
  "/dashboard/tables",
  tokenVerification,
  allowRoles("admin"),
  dashboardController.getTablePerformance
);
router.get(
  "/dashboard/top-customers",
  tokenVerification,
  allowRoles("admin"),
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

export default router;




