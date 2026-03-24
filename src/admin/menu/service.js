import Menu from "../../../model/menu.js";
import { Category } from "../../../model/category.js";
import { deleteSingleFile } from "../../../utils/s3utils.js";
import { ApiError } from "../../../utils/apiError.js";

export const menuService = {
  createMenu: async (adminId, body, file) => {
    if (!file) {
      throw new ApiError(400, "Image is required");
    }
    const categoryExists = await Category.findOne({
      name: { $regex: new RegExp(`^${body.category}$`, "i") }
    });
    if (!categoryExists) {
      throw new ApiError(404, `Category '${body.category}' does not exist`);
    }
    const menu = await Menu.create({
      ...body,
      adminId,
      category: categoryExists.name,
      image: file.location,
      price: Number(body.price),
      discountPrice: body.discountPrice ? Number(body.discountPrice) : undefined,
      inStock: body.isActive === false ? false : body.inStock,
    });
    return menu;
  },
  updateMenu: async (menuId, body, file) => {
    const menu = await Menu.findById(menuId);
    if (!menu) {
      throw new ApiError(404, "Menu not found");
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
    if (body.isActive === false) body.inStock = false;
    Object.assign(menu, body);
    if (!menu.isActive) menu.inStock = false;

    await menu.save();
    return menu;
  },
  getAllMenus: async (filter, options) => {
    if (filter.isActive !== undefined) {
      filter.isActive = filter.isActive === "true";
    }
    if (filter.inStock !== undefined) {
      filter.inStock = filter.inStock === "true";
    }
    return await Menu.paginate(filter, options);
  },
  getPublicMenus: async (adminId, query) => {
    const filter = {
      adminId,
      isActive: true,
    };
    if (query.inStock !== undefined) {
      filter.inStock = query.inStock === "true";
    }
    if (query.category) {
      filter.category = query.category;
    }
    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
    }
    const menus = await Menu.find(filter)
      .select(
        "name description image price discountPrice category isActive inStock"
      )
      .populate("category", "name")
      .sort({ createdAt: -1 });
    return menus;
  },
  getMenusByAdmin: async (adminId, filter, options) => {
    filter.adminId = adminId;
    if (filter.category) {
      filter.category = filter.category;
    }
    if (filter.isActive !== undefined) {
      filter.isActive = filter.isActive === "true";
    }
    if (filter.inStock !== undefined) {
      filter.inStock = filter.inStock === "true";
    }
    if (filter.search) {
      filter.$or = [
        { name: { $regex: filter.search, $options: "i" } },
        { category: { $regex: filter.search, $options: "i" } }
      ];
    }
    delete filter.search;
    return await Menu.paginate(filter, options);
  },
  getMenuById: async (menuId) => {
    const menu = await Menu.findById(menuId);
    return menu;
  },
  getAdminUsedCategories: async (adminId, filter, options) => {
    // Step 1: Get categories used by this admin in Menu
    const usedCategories = await Menu.distinct("category", { adminId });
    const query = {
      name: { $in: usedCategories }
    };
    if (filter.search) {
      query.name = {
        $in: usedCategories,
        $regex: filter.search,
        $options: "i"
      };
    }
    const result = await Category.paginate(query, filter, options);
    return result;
  },
};
