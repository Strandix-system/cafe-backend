import { Category } from '../../../model/category.js';
import Menu from '../../../model/menu.js';
import { ApiError } from '../../../utils/apiError.js';
import { CATEGORY_TYPES } from '../../../utils/constants.js';
import { deleteSingleFile } from '../../../utils/s3utils.js';

export const menuService = {
  createMenu: async (adminId, body, file) => {
    if (!file) {
      throw new ApiError(400, 'Image is required');
    }
    const categoryExists = await Category.findOne({
      _id: body.category,
      type: CATEGORY_TYPES.MENU,
    });
    if (!categoryExists) {
      throw new ApiError(404, 'Category not found');
    }
    const menu = await Menu.create({
      ...body,
      adminId,
      category: categoryExists._id,
      image: file.location,
      price: Number(body.price),
      discountPrice: body.discountPrice
        ? Number(body.discountPrice)
        : undefined,
      inStock: body.inStock,
    });
    return await Menu.findById(menu._id).populate('category', 'name');
  },

  updateMenu: async (menuId, body, file) => {
    const menu = await Menu.findById(menuId);

    if (!menu) {
      throw new ApiError(404, 'Menu not found');
    }

    if (body.category) {
      const categoryExists = await Category.findOne({
        _id: body.category,
        type: CATEGORY_TYPES.MENU,
      });

      if (!categoryExists) {
        throw new ApiError(404, 'Category not found');
      }

      body.category = categoryExists._id;
    }

    if (file?.location) {
      if (menu.image) {
        try {
          await deleteSingleFile(menu.image);
        } catch (err) {
          console.error('❌ S3 Delete Error:', err.message);
        }
      }

      body.image = file.location;
    }

    if (body.price) {
      body.price = Number(body.price);
    }

    if (body.discountPrice) {
      body.discountPrice = Number(body.discountPrice);
    }

    Object.assign(menu, body);

    await menu.save();

    return await Menu.findById(menu._id).populate('category', 'name');
  },

  getAllMenus: async (filter, options) => {
    if (filter.isActive !== undefined) {
      filter.isActive = filter.isActive === 'true';
    }

    if (filter.inStock !== undefined) {
      filter.inStock = filter.inStock === 'true';
    }

    if (filter.search) {
      filter.name = { $regex: filter.search, $options: 'i' };
      delete filter.search;
    }

    options.populate = 'category';

    return await Menu.paginate(filter, options);
  },
  getPublicMenus: async (adminId, query) => {
    const filter = {
      adminId,
      isActive: true,
    };
    if (query.inStock !== undefined) {
      filter.inStock = query.inStock === 'true';
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }
    const menus = await Menu.find(filter)
      .select(
        'name description image price discountPrice category isActive inStock',
      )
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    return menus;
  },
  getMenusByAdmin: async (adminId, filter, options) => {
    filter.adminId = adminId;
    if (filter.isActive !== undefined) {
      filter.isActive = filter.isActive === 'true';
    }
    if (filter.inStock !== undefined) {
      filter.inStock = filter.inStock === 'true';
    }

    if (filter.search) {
      filter.name = { $regex: filter.search, $options: 'i' };
      delete filter.search;
    }
    options.populate = 'category';
    return await Menu.paginate(filter, options);
  },
  getMenuById: async (menuId) => {
    const menu = await Menu.findById(menuId).populate('category', 'name');

    if (!menu) {
      throw new ApiError(404, 'Menu not found');
    }

    return menu;
  },
};
