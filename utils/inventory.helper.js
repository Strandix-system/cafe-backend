import mongoose from 'mongoose';

import { Inventory } from '../model/inventory.model.js';
import Menu from '../model/menu.js';
import { Recipe } from '../model/recipe.model.js';

import { ApiError } from './apiError.js';
import { STOCK_TYPES } from './constants.js';

export const updateMenuStockStatus = async (menuId) => {
  const recipe = await Recipe.findOne({
    menuId,
    isActive: true,
  }).populate('ingredients.inventoryItemId');

  if (!recipe) {
    await Menu.findByIdAndUpdate(menuId, {
      inStock: false,
      stockStatus: STOCK_TYPES.OUT_OF_STOCK,
    });

    return;
  }

  let stockStatus = STOCK_TYPES.IN_STOCK;

  for (const ingredient of recipe.ingredients) {
    const inventory = ingredient.inventoryItemId;

    if (!inventory || !inventory.isActive) {
      stockStatus = STOCK_TYPES.OUT_OF_STOCK;
      break;
    }

    const requiredQuantity =
      ingredient.quantity +
      (ingredient.quantity * (ingredient.wastagePercent || 0)) / 100;

    if (inventory.currentStock < requiredQuantity) {
      stockStatus = STOCK_TYPES.OUT_OF_STOCK;
      break;
    } else if (inventory.currentStock <= requiredQuantity * 3) {
      stockStatus = STOCK_TYPES.LOW_STOCK;
    }
  }

  await Menu.findByIdAndUpdate(menuId, {
    inStock: stockStatus !== STOCK_TYPES.OUT_OF_STOCK,
    stockStatus,
  });
};

export const updateMenusUsingInventory = async (inventoryItemId) => {
  const inventoryObjectId =
    typeof inventoryItemId === 'string'
      ? new mongoose.Types.ObjectId(inventoryItemId)
      : inventoryItemId;

  const recipes = await Recipe.find({
    isActive: true,
  }).select('menuId ingredients');

  const matchedRecipes = recipes.filter((recipe) =>
    recipe.ingredients.some((ingredient) => {
      const ingredientInventoryId =
        ingredient.inventoryItemId?._id || ingredient.inventoryItemId;

      return ingredientInventoryId?.toString() === inventoryObjectId.toString();
    }),
  );

  for (const recipe of matchedRecipes) {
    await updateMenuStockStatus(recipe.menuId);
  }
};

export const deductInventoryForOrder = async (orderItems) => {
  for (const item of orderItems) {
    const recipe = await Recipe.findOne({
      menuId: item.menuId,
      isActive: true,
    });

    if (!recipe) {
      continue;
    }

    for (const ingredient of recipe.ingredients) {
      const inventory = await Inventory.findById(ingredient.inventoryItemId);

      if (!inventory) {
        continue;
      }

      const requiredQuantity =
        ingredient.quantity * item.quantity +
        ((ingredient.quantity * (ingredient.wastagePercent || 0)) / 100) *
          item.quantity;

      if (inventory.currentStock < requiredQuantity) {
        throw new ApiError(400, `${inventory.name} does not have enough stock`);
      }

      inventory.currentStock -= requiredQuantity;

      await inventory.save();

      await updateMenusUsingInventory(inventory._id);
    }
  }
};
