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
// import dashboardRoute from "../../routes/dashboardRoute.js";
import { parseJSONFields } from "../../utils/helper.js";

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
  allowRoles("superadmin"),
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

// router.use("/dashboard", dashboardRoute);

export default router;




