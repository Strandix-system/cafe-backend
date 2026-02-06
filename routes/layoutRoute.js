import express from "express";
import cafeLayoutController from "../src/admin/layout/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import { uploadLayoutImages } from "../middleware/upload.js";

const router = express.Router();

/**
 * 🔹 SUPER ADMIN
 * Create DEFAULT layout
 */
router.post(
  "/default",
  tokenVerification,
  allowRoles("superadmin"),
  uploadLayoutImages,
  cafeLayoutController.createCafeLayout
);

/**
 * 🔹 ADMIN DASHBOARD
 * Get layout:
 * - Admin layout if exists
 * - Else default layout
 */
router.get(
  "/",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  cafeLayoutController.getLayoutForAdminDashboard
);

/**
 * 🔹 ADMIN
 * Create own cafe layout (first time)
 */
router.post(
  "/admin-create",
  tokenVerification,
  allowRoles("admin"),
  uploadLayoutImages,
  cafeLayoutController.createCafeLayout
);

/**
 * 🔹 ADMIN
 * Update own cafe layout
 */
router.put(
  "/update/:id",
  tokenVerification,
  allowRoles("admin"),
  uploadLayoutImages,
  cafeLayoutController.updateCafeLayout
);

/**
 * 🔹 SUPER ADMIN
 * Delete DEFAULT layout
 */
router.delete(
  "/delete/:id",
  tokenVerification,
  allowRoles("superadmin"),
  cafeLayoutController.deleteCafeLayout
);

router.get(
  "/portfolio/:adminId",
  cafeLayoutController.getLayoutForPortfolio
);

export default router;
