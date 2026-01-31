import express from "express";
import layoutController from "../src/admin/layout/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import { validateImageCountBeforeUpload, validateTemplateImageCountBeforeUpload } from "../middleware/validateImageCount.js";
import { validate } from "../middleware/validate.js";
import { createCafeLayoutValidator } from "../validations/createTemplate.js";

const router = express.Router();

// SUPERADMIN
router.post(
  "/create",
  tokenVerification,
  allowRoles("superadmin"),
  validateTemplateImageCountBeforeUpload,
  layoutController.createLayout
);

router.get("/",layoutController.getAllLayoutTemplates);

// ADMIN
router.post("/cafe-layout", tokenVerification, allowRoles("admin"), validateImageCountBeforeUpload,
 validate(createCafeLayoutValidator),
 layoutController.createCafeLayout
);

router.get("/cafe-layout", layoutController.getAdminLayout);

export default router;

