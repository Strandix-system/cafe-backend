import express from "express";
import layoutController from "../src/admin/layout/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import upload from "../middleware/upload.js"
import { validate } from "../middleware/validate.js";
import { createTemplateValidator, createCafeLayoutValidator} from "../validations/createTemplate.js";

const router = express.Router();
// SUPERADMIN
router.post(
  "/template",
    tokenVerification,
    allowRoles("superadmin"),
  validate(createTemplateValidator),
  layoutController.createTemplate
);

// ADMIN
router.post(
  "/cafe-layout",
    tokenVerification,
    allowRoles("admin"),
  upload.array("images"),
  validate(createCafeLayoutValidator),
  layoutController.createCafeLayout
);

router.get("/cafe-layout", layoutController.getAdminLayout);

export default router;

