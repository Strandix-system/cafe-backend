import { Category } from '../../../model/category.js';
import Menu from '../../../model/menu.js';
import { ApiError } from '../../../utils/apiError.js';
import { CATEGORY_TYPES } from '../../../utils/constants.js';
import { deleteSingleFile } from '../../../utils/s3utils.js';

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const menuService = {
  createMenu: async (adminId, outletId, body, file) => {
    if (!file) {
      throw new ApiError(400, 'Image is required');
    }
    const categoryName = String(body.category ?? '').trim();
    if (!categoryName) {
      throw new ApiError(400, 'Category is required');
    }
    const categoryNameRegex = new RegExp(`^${escapeRegex(categoryName)}$`, 'i');

    const categoryExists = await Category.findOne({
      type: CATEGORY_TYPES.MENU,
      name: { $regex: categoryNameRegex },
      $or: [
        // outlet-scoped category for this admin/outlet
        {
          adminId,
          ...(outletId ? { outletId } : {}),
        },
        // global category (shared across all admins/outlets)
        { outletId: null },
      ],
    });
    if (!categoryExists) {
      throw new ApiError(404, `Category '${categoryName}' does not exist`);
    }
    const menu = await Menu.create({
      ...body,
      adminId,
      outletId,
      category: categoryExists.name,
      image: file.location,
      price: Number(body.price),
      discountPrice: body.discountPrice
        ? Number(body.discountPrice)
        : undefined,
      inStock: body.inStock,
    });
    return menu;
  },
  updateMenu: async (menuId, adminId, outletId, body, file) => {
    const menu = await Menu.findOne({
      _id: menuId,
      adminId,
      ...(outletId ? { outletId } : {}),
    });
    if (!menu) {
      throw new ApiError(404, 'Menu not found');
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
    Object.assign(menu, body);

    await menu.save();
    return menu;
  },
  getAllMenus: async (adminId, outletId, filter, options) => {
    filter.adminId = adminId;
    if (outletId) {
      filter.outletId = outletId;
    }
    if (filter.isActive !== undefined) {
      filter.isActive = filter.isActive === 'true';
    }
    if (filter.inStock !== undefined) {
      filter.inStock = filter.inStock === 'true';
    }
    return await Menu.paginate(filter, options);
  },
  getPublicMenus: async (adminId, query) => {
    const filter = {
      adminId,
      ...(query.outletId ? { outletId: query.outletId } : {}),
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
  getMenusByAdmin: async (adminId, outletId, filter, options) => {
    filter.adminId = adminId;
    if (outletId) {
      filter.outletId = outletId;
    }
    if (filter.isActive !== undefined) {
      filter.isActive = filter.isActive === 'true';
    }
    if (filter.inStock !== undefined) {
      filter.inStock = filter.inStock === 'true';
    }
    if (filter.search) {
      filter.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { category: { $regex: filter.search, $options: 'i' } },
      ];
    }
    delete filter.search;
    return await Menu.paginate(filter, options);
  },
  getMenuById: async (menuId, adminId, outletId) => {
    const menu = await Menu.findOne({
      _id: menuId,
      adminId,
      ...(outletId ? { outletId } : {}),
    });
    return menu;
  },
};
