import express from "express";
import cafeLayoutController from "../src/admin/layout/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import {uploadLayoutImages }from "../middleware/upload.js";

const router = express.Router();

router.post(
  "/create",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  uploadLayoutImages,
  cafeLayoutController.createCafeLayout
);

router.put(
  "/update/:id",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  uploadLayoutImages,
  cafeLayoutController.updateCafeLayout
);

router.get(
  "/",
  tokenVerification,
  allowRoles("superadmin", "admin"),
  cafeLayoutController.getCafeLayout
);

router.delete(
  "/delete/:id",
  tokenVerification,
  allowRoles("superadmin"),
  cafeLayoutController.deleteCafeLayout
);

export default router;

