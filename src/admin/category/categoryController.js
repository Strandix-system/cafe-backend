import {categoryService} from "./categoryService.js";
import { sendSuccessResponse } from "../../../utils/response.js";
import { pick } from "../../../utils/pick.js";

export default {
  createCategory: async (req, res) => {
    const result = await categoryService.createCategory(req.body);
    sendSuccessResponse(res, 201, "Category created successfully", result);
  },
  getAllCategories: async (req, res) => {
    const filter = pick(req.query, ["search"]);
    const options = pick(req.query, ["page", "limit", "sortBy"]);
    const categories = await categoryService.getAllCategories(filter, options);
    sendSuccessResponse(res, 200, "Categories fetched successfully", categories);
  },
  updateCategory: async (req, res) => {
    const category = await categoryService.updateCategoryById(
      req.params.categoryId,
      req.body
    );
    sendSuccessResponse(res, 200, "Category updated successfully", category);
  },
  deleteCategory: async (req, res) => {
    await categoryService.deleteCategoryById(req.params.categoryId);
    sendSuccessResponse(res, 200, "Category deleted successfully");
  },
  getCategoriesForDropdown: async (req, res) => {
    const categories = await categoryService.getCategoriesForDropdown();
    sendSuccessResponse(res, 200, "Categories fetched successfully", categories);
  },
  getCategoryById: async (req, res) => {
    const category = await categoryService.getCategoryById(req.params.id);
    sendSuccessResponse(res, 200, "Category fetched successfully", category);
  },
  getAdminUsedCategories: async (req, res) => {
    const filter = pick(req.query, ["search"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
    const result = await categoryService.getAdminUsedCategories(
      req.user.id,
      filter,
      options
    );
    sendSuccessResponse(res, 200, "Categories fetched successfully", result);
  },
};
