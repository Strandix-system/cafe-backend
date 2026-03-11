import express from "express";
import { cafeLayoutController } from "../src/admin/layout/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import { uploadLayoutImages } from "../middleware/upload.js";

export const layoutRoute = express.Router();
layoutRoute.post(
  "/create",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  uploadLayoutImages,
  cafeLayoutController.createCafeLayout
);

// used by portfolio website
layoutRoute.get(
  "/get-layout/:id",
  // tokenVerification,
  // allowRoles("superadmin", "admin"),
  cafeLayoutController.getLayoutById
);

layoutRoute.patch(
  "/update-status",
  tokenVerification,
  allowRoles("admin", " superadmin"),
  cafeLayoutController.updateLayoutStatus
);
layoutRoute.delete(
  "/delete/:id",
  tokenVerification,
  allowRoles("superadmin","admin"),
  cafeLayoutController.deleteCafeLayout
);
layoutRoute.patch(
  "/update/:id",
  tokenVerification,
  allowRoles("admin", " superadmin"),
  uploadLayoutImages,
  cafeLayoutController.updateCafeLayout
);
layoutRoute.get(
  "/admin-layout",
  tokenVerification,
  allowRoles("admin"),
  cafeLayoutController.getCafeLayoutByAdmin
);
layoutRoute.get(
  "/active/:id",
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
  cafeLayoutController.getLayoutById
)

