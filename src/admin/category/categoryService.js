import { Category } from '../../../model/category.js';
import Menu from '../../../model/menu.js';
import { ApiError } from '../../../utils/apiError.js';
import { CATEGORY_TYPES } from '../../../utils/constants.js';
export const categoryService = {
  createCategory: async (context, data) => {
    if (!context?.adminId) {
      throw new ApiError(401, 'Unauthorized');
    }
    const exists = await Category.findOne({
      adminId: context.adminId,
      ...(context.outletId ? { outletId: context.outletId } : {}),
      type: data.type,
      name: { $regex: new RegExp(`^${data.name}$`, 'i') },
    });
    if (exists) {
      throw new ApiError(409, 'Category already exists');
    }
    const payload = {
      ...data,
      adminId: context.adminId,
      outletId: context.outletId,
    };
    const result = await Category.create(payload);
    return result;
  },
  getAllCategories: async (context, filter, options) => {
    if (filter.search) {
      filter.name = { $regex: filter.search, $options: 'i' };
      delete filter.search;
    }
    filter.adminId = context.adminId;
    if (context.outletId) {
      filter.outletId = context.outletId;
    }
    const result = await Category.paginate(filter, options);
    return result;
  },
  updateCategoryById: async (categoryId, context, data) => {
    const category = await Category.findOne({
      _id: categoryId,
      adminId: context.adminId,
      ...(context.outletId ? { outletId: context.outletId } : {}),
    });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    const updatedCategory = await Category.findOneAndUpdate(
      {
        _id: categoryId,
        adminId: context.adminId,
        ...(context.outletId ? { outletId: context.outletId } : {}),
      },
      { $set: data },
      { new: true, runValidators: true },
    );
    return updatedCategory;
  },
  deleteCategoryById: async (categoryId, context) => {
    const category = await Category.findOneAndDelete({
      _id: categoryId,
      adminId: context.adminId,
      ...(context.outletId ? { outletId: context.outletId } : {}),
    });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  },
  getCategoryById: async (categoryId, context) => {
    const category = await Category.findOne({
      _id: categoryId,
      adminId: context.adminId,
      ...(context.outletId ? { outletId: context.outletId } : {}),
    });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  },
  getCategoriesForDropdown: async (context, filter = {}) => {
    const query = {
      adminId: context.adminId,
      ...(context.outletId ? { outletId: context.outletId } : {}),
    };
    if (filter.type) {
      query.type = filter.type;
    }

    return await Category.find(query).select('_id name').sort({ name: 1 });
  },
  getUsedCategoriesForDropdown: async (context) => {
    const usedCategoryIds = await Menu.distinct('category', {
      adminId: context.adminId,
      ...(context.outletId ? { outletId: context.outletId } : {}),
    });

    const categories = await Category.find({
      adminId: context.adminId,
      ...(context.outletId ? { outletId: context.outletId } : {}),
      type: CATEGORY_TYPES.MENU,
      name: { $in: usedCategoryIds },
    })
      .select('_id name')
      .sort({ name: 1 });

    return {
      adminId: context.adminId,
      outletId: context.outletId,
      categories,
    };
  },
};
