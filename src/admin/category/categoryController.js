import categoryService from "./categoryService.js";
import {sendSuccessResponse} from "../../../utils/response.js";

export default{
 createCategory :async (req, res, next) => {
  try {
    const result = await categoryService.createCategory(req.body);
    sendSuccessResponse(res, 201, "Category created successfully", result);
  } catch (error) {
    next(error);
  }
},
 getCategories : async (req, res, next) => {
  try {
    const categories = await categoryService.getAllCategories();
    sendSuccessResponse(res, 200, "Categories fetched successfully", categories);
  } catch (error) {
    next(error);
  }
},
updateCategory : async (req, res, next) => {
  try {
    const category = await categoryService.updateCategoryById  (
      req.params.id,
      req.body
    );
    sendSuccessResponse(res, 200, "Category updated successfully", category);
  } catch (error) {
    next(error);
  }
},
 deleteCategory :async (req, res, next) => {
   try {
    await categoryService.deleteCategoryById(req.params.id);
    sendSuccessResponse(res, 200, "Category deleted successfully");
  } catch (error) {
    next(error);
  }
}
};
