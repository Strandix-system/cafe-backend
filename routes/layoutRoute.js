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
  cafeLayoutController.getLayoutById
);
router.delete(
  "/delete/:id",
  tokenVerification,
  allowRoles("superadmin"),
  cafeLayoutController.deleteCafeLayout
);
router.patch(
  "/update/:id",
  tokenVerification,
  allowRoles("admin", " superadmin"),
  uploadLayoutImages,
  cafeLayoutController.updateCafeLayout
);
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
router.get(
  "/all-layouts",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  cafeLayoutController.getAllLayout
);

export default router;