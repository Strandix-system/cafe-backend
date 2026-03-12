import express from "express";
import { tokenVerification } from "../middleware/auth.js";
import { categoryController } from "../src/admin/category/categoryController.js";
import { allowRoles } from "../middleware/permission.js";
import { validate } from "../middleware/validate.js";
import {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdParamValidator,
  idParamValidator,
} from "../validations/category.validation.js";

const router = express.Router();

// Only admin / superadmin
router.post(
  "/create",
  tokenVerification,
  allowRoles("superadmin"),
  validate(createCategoryValidator),
  categoryController.createCategory
);

router.get(
  "/",
  tokenVerification,
  categoryController.getAllCategories
);
router.get("/categories", categoryController.getCategoriesForDropdown);
router.patch(
  "/update/:categoryId",
  tokenVerification,
  allowRoles("superadmin"),
  validate(updateCategoryValidator),
  categoryController.updateCategory
);
router.delete(
  "/delete/:categoryId",
  tokenVerification,
  allowRoles("superadmin"),
  validate(categoryIdParamValidator),
  categoryController.deleteCategory
);
router.get(
  "/get-by-id/:id",
  tokenVerification,
  allowRoles("superadmin"),
  validate(idParamValidator),
  categoryController.getCategoryById
);
router.get(
  "/admin-category",
  tokenVerification,
  allowRoles("admin"),
  categoryController.getUsedCategoriesForDropdown
);

export const categoryRoutes = router;
