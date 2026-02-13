import express from "express";
import { tokenVerification } from "../middleware/auth.js";
import categoryController from "../src/admin/category/categoryController.js";
import { allowRoles } from "../middleware/permission.js";

const router = express.Router();

// Only admin / superadmin
router.post(
  "/create",
  tokenVerification,
  allowRoles("superadmin"),
  categoryController.createCategory
);

router.get(
  "/get-all-categories",
  tokenVerification,
  categoryController.getAllCategories
);
router.get("/categories", categoryController.getCategoriesForDropdown);
router.patch(
  "/update/:categoryId",
  tokenVerification,
    allowRoles("superadmin"),
  categoryController.updateCategory
);
router.delete(
  "/delete/:categoryId",
  tokenVerification,
    allowRoles("superadmin"),
  categoryController.deleteCategory
);
router.get(
  "/get-by-id/:id",
  tokenVerification,
    allowRoles( "superadmin"),
  categoryController.getCategoryById
);

export default router;
