import { Category } from '../../../model/category.js';
import Menu from '../../../model/menu.js';
import { ApiError } from '../../../utils/apiError.js';
import { CATEGORY_TYPES } from '../../../utils/constants.js';
import { hasValidStaffRole } from '../../../utils/utils.js';
export const categoryService = {
  createCategory: async (user, data) => {
    if (!user) {
      throw new ApiError(401, 'Unauthorized');
    }
    const exists = await Category.findOne({
      adminId: user._id,
      type: data.type,
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
    });
    if (exists) {
      throw new ApiError(409, 'Category already exists');
    }
    const payload = { ...data, adminId: user._id };
    const result = await Category.create(payload);
    return result;
  },
  getAllCategories: async (filter, options) => {
    if (filter.search) {
      filter.name = { $regex: filter.search, $options: 'i' };
      delete filter.search;
    }
    const result = await Category.paginate(filter, options);
    return result;
  },
  updateCategoryById: async (categoryId, data) => {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { $set: data },
      { new: true, runValidators: true },
    );
    return updatedCategory;
  },
  deleteCategoryById: async (categoryId) => {
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  },
  getCategoryById: async (categoryId) => {
    const category = await Category.findById(categoryId);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  },
  getCategoriesForDropdown: async (filter = {}) => {
    const query = {};
    if (filter.type) {
      query.type = filter.type;
    }

    return await Category.find(query).select('_id name').sort({ name: 1 });
  },
  getUsedCategoriesForDropdown: async (user, requestedAdminId) => {
    const adminId = await categoryService.resolveAdminIdForUsedCategories(
      user,
      requestedAdminId,
    );

    const usedCategoryIds = await Menu.distinct('category', { adminId });

    const categories = await Category.find({
      _id: { $in: usedCategoryIds },
      type: CATEGORY_TYPES.MENU,
    })
      .select('_id name')
      .sort({ name: 1 });

    return { adminId, categories };
  },

  resolveAdminIdForUsedCategories: async (user, requestedAdminId) => {
    if (user.role === 'superadmin') {
      if (!requestedAdminId) {
        throw new ApiError(400, 'adminId is required for superadmin');
      }
      return requestedAdminId;
    }

    if (hasValidStaffRole(user.role)) {
      if (!user.adminId) {
        throw new ApiError(400, 'adminId not found for staff user');
      }
      return user.adminId;
    }

    return user._id;
  },
};
