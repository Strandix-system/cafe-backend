import { Category } from "../../../model/category.js";
import Menu from "../../../model/menu.js";
import { ApiError } from "../../../utils/apiError.js";
export const categoryService = {
  createCategory: async (data) => {
    const exists = await Category.findOne({ name: data.name });
    if (exists) {
      throw new ApiError(409, "Category already exists");
    }
    const result = await Category.create(data);
    return result;
  },
  getAllCategories: async (filter, options) => {
    if (filter.search) {
      filter.name = { $regex: filter.search, $options: "i" };
      delete filter.search;
    }
    const result = await Category.paginate(filter, options);
    return result;
  },
  updateCategoryById: async (categoryId, data) => {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { $set: data },
      { new: true, runValidators: true }
    );
    return updatedCategory;
  },
  deleteCategoryById: async (categoryId) => {
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return category;
  },
  getCategoryById: async (categoryId) => {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return category;
  },
  getCategoriesForDropdown: async () => {
    return await Category.find()
      .select("_id name")
      .sort({ name: 1 });
  },
  getUsedCategoriesForDropdown: async (user, requestedAdminId) => {
    const adminId = await categoryService.resolveAdminIdForUsedCategories(
      user,
      requestedAdminId
    );

    const usedCategoryIds = await Menu.distinct("category", { adminId });

    const categories = await Category.find({
      name: { $in: usedCategoryIds }
    })
      .select("_id name")
      .sort({ name: 1 });

    return { adminId, categories };
  },

  resolveAdminIdForUsedCategories: async (user, requestedAdminId) => {
    if (user.role === "superadmin") {
      if (!requestedAdminId) {
        throw new ApiError(400, "adminId is required for superadmin");
      }
      return requestedAdminId;
    }

    return user._id;
  },
};

