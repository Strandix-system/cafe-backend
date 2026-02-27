import categoryService from "./categoryService.js";
import {sendSuccessResponse} from "../../../utils/response.js";
import { pick } from "../../../utils/pick.js";

export default{
 createCategory :async (req, res, next) => {
  try {
    const result = await categoryService.createCategory(req.body);
    sendSuccessResponse(res, 201, "Category created successfully", result);
  } catch (error) {
    next(error);
  }
},
 getAllCategories : async (req, res, next) => {
  try {
    const filter = pick(req.query, ["search"]);
    const options = pick(req.query, ["page", "limit", "sortBy"]);
    const categories = await categoryService.getAllCategories(filter, options);
    sendSuccessResponse(res, 200, "Categories fetched successfully", categories);
  } catch (error) {
    next(error);
  }
},
updateCategory : async (req, res, next) => {
  try {
    const category = await categoryService.updateCategoryById  (
      req.params.categoryId,
      req.body
    );
    sendSuccessResponse(res, 200, "Category updated successfully", category);
  } catch (error) {
    next(error);
  }
},
 deleteCategory :async (req, res, next) => {
   try {
    await categoryService.deleteCategoryById(req.params.categoryId);
    sendSuccessResponse(res, 200, "Category deleted successfully");
  } catch (error) {
    next(error);
  }
},
getCategoriesForDropdown: async (req, res, next) => {
  try {
    const categories = await categoryService.getCategoriesForDropdown();
    sendSuccessResponse(res, 200, "Categories fetched successfully", categories);
  } catch (err) {
    next(err);
  }
},
getCategoryById: async (req, res, next) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    sendSuccessResponse(res, 200, "Category fetched successfully", category);
  } catch (err) {
    next(err);
  }
},
getAdminUsedCategories: async (req, res, next) => {
  try {
    const filter = pick(req.query, ["search"]);
    const options = pick(req.query, ["page", "limit", "sortBy","populate"]);

    const result = await categoryService.getAdminUsedCategories(
      req.user.id,
      filter,
      options
    );

    sendSuccessResponse(res, 200, "Categories fetched successfully", result);
  } catch (error) {
    next(error);
  }
},
};
