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

const router = express.Router();

router.post(
  "/create",
  tokenVerification,
  allowRoles("superadmin"),
  validate(createAdminValidator),
  controller.createAdmin
);
router.patch(
  "/update/:id",
  tokenVerification,
  allowRoles("superadmin"),
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

export default router;




