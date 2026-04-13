import mongoose from 'mongoose';

import { Category } from '../../../model/category.js';
import { Inventory } from '../../../model/inventory.model.js';
import Menu from '../../../model/menu.js';
import { Recipe } from '../../../model/recipe.model.js';
import { ApiError } from '../../../utils/apiError.js';
import { CATEGORY_TYPES } from '../../../utils/constants.js';
import { updateMenuStockStatus } from '../../../utils/inventory.helper.js';
import { deleteSingleFile } from '../../../utils/s3utils.js';

const formatRecipeIngredients = async (ingredients = []) => {
  return await Promise.all(
    ingredients.map(async (item) => {
      const inventoryItem = await Inventory.findById(item.inventoryItemId);

      if (!inventoryItem) {
        throw new ApiError(404, 'Inventory item not found');
      }

      if (inventoryItem.unit !== item.unit) {
        throw new ApiError(
          400,
          `${inventoryItem.name} unit must be ${inventoryItem.unit}`,
        );
      }

      return {
        ...item,
        inventoryItemId: new mongoose.Types.ObjectId(item.inventoryItemId),
      };
    }),
  );
};

export const menuService = {
  createMenu: async (adminId, body, file) => {
    if (!file) {
      throw new ApiError(400, 'Image is required');
    }

    const normalizedName = body.name.trim().toLowerCase();

    const categoryExists = await Category.findOne({
      _id: body.category,
      type: CATEGORY_TYPES.MENU,
    });

    if (!categoryExists) {
      throw new ApiError(404, 'Category not found');
    }

    const existingMenu = await Menu.findOne({
      adminId,
      name: normalizedName,
      isActive: true,
    });

    if (existingMenu) {
      throw new ApiError(400, 'Menu already exists');
    }

    const menu = await Menu.create({
      ...body,
      name: normalizedName,
      adminId,
      category: categoryExists._id,
      image: file.location,
      price: Number(body.price),
      discountPrice: body.discountPrice
        ? Number(body.discountPrice)
        : undefined,
      inStock: body.inStock,
    });

    if (body.ingredients?.length) {
      const formattedIngredients = await formatRecipeIngredients(
        body.ingredients,
      );
      await Recipe.create({
        menuId: menu._id,
        ingredients: formattedIngredients,
        preparationInstructions: body.preparationInstructions ?? [],
        servingSize: body.servingSize ?? 1,
        preparationTime: body.preparationTime ?? 0,
        note: body.note ?? '',
        isActive: true,
        createdBy: adminId,
      });
      await updateMenuStockStatus(menu._id);
    }
    return await Menu.findById(menu._id).populate('category', 'name');
  },
  updateMenu: async (menuId, body, file) => {
    const menu = await Menu.findById(menuId);

    if (!menu) {
      throw new ApiError(404, 'Menu not found');
    }

    if (body.name) {
      const normalizedName = body.name.trim().toLowerCase();

      const existingMenu = await Menu.findOne({
        _id: { $ne: menuId },
        adminId: menu.adminId,
        name: normalizedName,
        isActive: true,
      });

      if (existingMenu) {
        throw new ApiError(400, 'Menu already exists');
      }

      body.name = normalizedName;
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
    if (body.ingredients?.length) {
      const formattedIngredients = await formatRecipeIngredients(
        body.ingredients,
      );
      const recipe = await Recipe.findOne({
        menuId: menu._id,
      });

      if (recipe) {
        recipe.ingredients = formattedIngredients;

        if (body.preparationInstructions !== undefined) {
          recipe.preparationInstructions = body.preparationInstructions;
        }

        if (body.servingSize !== undefined) {
          recipe.servingSize = body.servingSize;
        }

        if (body.preparationTime !== undefined) {
          recipe.preparationTime = body.preparationTime;
        }

        if (body.note !== undefined) {
          recipe.note = body.note;
        }

        if (body.isActive !== undefined) {
          recipe.isActive = body.isActive;
        }

        await recipe.save();
      } else {
        await Recipe.create({
          menuId: menu._id,
          ingredients: formattedIngredients,
          preparationInstructions: body.preparationInstructions ?? [],
          servingSize: body.servingSize ?? 1,
          preparationTime: body.preparationTime ?? 0,
          note: body.note ?? '',
          isActive: true,
          createdBy: menu.adminId,
        });
        await updateMenuStockStatus(menu._id);
      }
    }
    await menu.save();

    await updateMenuStockStatus(menu._id);

    return await Menu.findById(menu._id).populate('category', 'name');
  },
  getRecipeListByAdmin: async (adminId, filter = {}, options = {}) => {
    const menuFilter = { adminId };

    if (filter.search) {
      menuFilter.name = {
        $regex: filter.search,
        $options: 'i',
      };
    }

    const menus = await Menu.find(menuFilter).select('_id');

    filter.menuId = {
      $in: menus.map((item) => item._id),
    };

    if (filter.isActive !== undefined) {
      filter.isActive = filter.isActive === 'true';
    }

    delete filter.search;

    options.page = Number(options.page) || 0;
    options.limit = Number(options.limit) || 10;
    options.sort = { createdAt: -1 };
    options.lean = true;

    const recipes = await Recipe.paginate(filter, options);

    recipes.results = await Recipe.populate(recipes.results, [
      {
        path: 'menuId',
        select: 'name category image price inStock isActive',
        populate: {
          path: 'category',
          select: 'name type',
        },
      },
      {
        path: 'ingredients.inventoryItemId',
        select: 'name currentStock unit image',
      },
    ]);

    recipes.results = recipes.results.map((recipe) => ({
      ...(recipe.toObject ? recipe.toObject() : recipe),
      ingredientsCount: recipe.ingredients?.length || 0,
    }));

    return recipes;
  },
  getRecipeByMenuId: async (menuId) => {
    const menu = await Menu.findById(menuId);

    if (!menu) {
      throw new ApiError(404, 'Menu not found');
    }

    const recipe = await Recipe.findOne({
      menuId,
    }).populate([
      {
        path: 'menuId',
        select: 'name category image price description inStock isActive',
        populate: {
          path: 'category',
          select: 'name type',
        },
      },
      {
        path: 'ingredients.inventoryItemId',
        select: 'name image currentStock unit',
      },
    ]);

    if (!recipe) {
      throw new ApiError(404, 'Recipe not found');
    }

    return recipe;
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
