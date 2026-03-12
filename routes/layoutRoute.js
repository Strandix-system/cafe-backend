import express from "express";
import { cafeLayoutController } from "../src/admin/layout/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import { uploadLayoutImages } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { cafeLayoutValidation } from "../validations/cafeLayoutValidation.js";

export const layoutRoute = express.Router();
layoutRoute.post(
  "/create",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  uploadLayoutImages,
  validate(cafeLayoutValidation.create),
  cafeLayoutController.createCafeLayout
);

// used by portfolio website
layoutRoute.get(
  "/get-layout/:id",
  // tokenVerification,
  // allowRoles("superadmin", "admin"),
  validate(cafeLayoutValidation.idParam),
  cafeLayoutController.getLayoutById
);

layoutRoute.patch(
  "/update-status",
  tokenVerification,
  allowRoles("admin", " superadmin"),
  validate(cafeLayoutValidation.updateStatus),
  cafeLayoutController.updateLayoutStatus
);
layoutRoute.delete(
  "/delete/:id",
  tokenVerification,
  allowRoles("superadmin","admin"),
  validate(cafeLayoutValidation.idParam),
  cafeLayoutController.deleteCafeLayout
);
layoutRoute.patch(
  "/update/:id",
  tokenVerification,
  allowRoles("admin", " superadmin"),
  uploadLayoutImages,
  validate(cafeLayoutValidation.update),
  cafeLayoutController.updateCafeLayout
);
layoutRoute.get(
  "/admin-layout",
  tokenVerification,
  allowRoles("admin"),
  validate(cafeLayoutValidation.adminLayoutQuery),
  cafeLayoutController.getCafeLayoutByAdmin
);
layoutRoute.get(
  "/active/:id",
  validate(cafeLayoutValidation.idParam),
  cafeLayoutController.getActiveLayout
);
layoutRoute.get(
  "/all-layouts",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  cafeLayoutController.getAllLayout
);
layoutRoute.get(
  "/:id",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  validate(cafeLayoutValidation.idParam),
  cafeLayoutController.getLayoutById
)

