import express from "express";
import cafeLayoutController from "../src/admin/layout/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import { uploadLayoutImages } from "../middleware/upload.js";

const router = express.Router();
router.post(
  "/create",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  uploadLayoutImages,
  cafeLayoutController.createCafeLayout
);
router.get(
  "/get-layout/:id",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  cafeLayoutController.getLayoutById)

// Delete any layout
router.delete(
  "/delete/:id",
  tokenVerification,
  allowRoles("superadmin"),
  cafeLayoutController.deleteCafeLayout
);

// Admin creates own layout
router.post(
  "/admin-create",
  tokenVerification,
  allowRoles("admin"),
  uploadLayoutImages,
  cafeLayoutController.createCafeLayout
);

// Admin updates own layout
router.patch(
  "/update/:id",
  tokenVerification,
  allowRoles("admin"," superadmin"),
  uploadLayoutImages,
  cafeLayoutController.updateCafeLayout
);

// Admin dashboard (own layout OR default)
router.get(
  "/admin-layout",
  tokenVerification,
  allowRoles("admin"),
  cafeLayoutController.getCafeLayoutByAdmin
);

router.get(
  "/portfolio/:id",
  cafeLayoutController.getLayoutForPortfolio
);
// Superadmin listing (all layouts)
router.get(
  "/all-layouts", 
  tokenVerification,
  allowRoles("superadmin"),
  cafeLayoutController.getAllLayout
);
export default router;