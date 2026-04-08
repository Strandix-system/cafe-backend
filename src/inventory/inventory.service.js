import mongoose from 'mongoose';

import { Category } from '../../model/category.js';
import { Inventory } from '../../model/inventory.model.js';
import { ApiError } from '../../utils/apiError.js';
import { STOCK_TYPES } from '../../utils/constants.js';
import { updateMenusUsingInventory } from '../../utils/inventory.helper.js';

const createInventory = async (body = {}) => {
  const { adminId, name, image, category, unit, currentStock, minStockLevel } =
    body;

  if (!adminId) {
    throw new ApiError(400, 'adminId is required');
  }

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ApiError(400, 'Invalid adminId');
  }

  if (!name?.trim()) {
    throw new ApiError(400, 'Item name is required');
  }

  if (!mongoose.Types.ObjectId.isValid(category)) {
    throw new ApiError(400, 'Invalid categoryId');
  }

  const categoryDoc = await Category.findOne({
    _id: category,
    $or: [{ adminId }, { adminId: null }, { adminId: { $exists: false } }],
  });

  if (!categoryDoc) {
    throw new ApiError(400, 'Invalid category');
  }

  const existingItem = await Inventory.findOne({
    adminId,
    name: name.trim(),
    isActive: true,
  });

  if (existingItem) {
    throw new ApiError(400, 'Inventory item already exists');
  }

  const inventory = await Inventory.create({
    adminId,
    name: name.trim(),
    image: image,
    category,
    type: categoryDoc.type,
    unit,
    currentStock: currentStock || 0,
    minStockLevel: minStockLevel || 0,
  });

  return inventory;
};
const getInventoryList = async (query = {}) => {
  const {
    adminId,
    search = '',
    category,
    lowStock,
    stockStatus,
    isActive,
    page = 0,
    limit = 10,
  } = query;

  if (!adminId) {
    throw new ApiError(400, 'adminId is required');
  }

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ApiError(400, 'Invalid adminId');
  }

  const filter = {
    adminId,
  };

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  } else {
    filter.isActive = true;
  }

  if (search) {
    filter.name = {
      $regex: search,
      $options: 'i',
    };
  }

  if (category) {
    if (!mongoose.Types.ObjectId.isValid(category)) {
      throw new ApiError(400, 'Invalid categoryId');
    }

    filter.category = category;
  }

  const options = {
    page: Number(page),
    limit: Number(limit),
    sort: { createdAt: -1 },
    lean: true,
    populate: 'category',
  };

  const inventoryList = await Inventory.paginate(filter, options);

  if (stockStatus) {
    inventoryList.results = inventoryList.results.filter((item) => {
      if (stockStatus === STOCK_TYPES.OUT_OF_STOCK) {
        return item.currentStock <= 0;
      }

      if (stockStatus === STOCK_TYPES.LOW_STOCK) {
        return item.currentStock > 0 && item.currentStock <= item.minStockLevel;
      }

      if (stockStatus === STOCK_TYPES.IN_STOCK) {
        return item.currentStock > item.minStockLevel;
      }

      return true;
    });
  }

  if (lowStock === 'true') {
    inventoryList.results = inventoryList.results.filter(
      (item) => item.currentStock <= item.minStockLevel,
    );
  }

  return inventoryList;
};
const getInventoryById = async ({ inventoryId, adminId }) => {
  if (!inventoryId) {
    throw new ApiError(400, 'inventoryId is required');
  }

  if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
    throw new ApiError(400, 'Invalid inventoryId');
  }

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ApiError(400, 'Invalid adminId');
  }

  const inventory = await Inventory.findOne({
    _id: inventoryId,
    adminId,
  });

  if (!inventory) {
    throw new ApiError(404, 'Inventory item not found');
  }

  return inventory;
};
const updateInventory = async ({ inventoryId, adminId, body }) => {
  const { name, image, category, unit, currentStock, minStockLevel, isActive } =
    body;

  if (!mongoose.Types.ObjectId.isValid(inventoryId)) {
    throw new ApiError(400, 'Invalid inventoryId');
  }

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ApiError(400, 'Invalid adminId');
  }

  const inventory = await Inventory.findOne({
    _id: inventoryId,
    adminId,
  });

  if (!inventory) {
    throw new ApiError(404, 'Inventory item not found');
  }

  if (image !== undefined) {
    inventory.image = image;
  }

  if (name) {
    const existingItem = await Inventory.findOne({
      _id: { $ne: inventoryId },
      adminId,
      name: name.trim(),
      isActive: true,
    });

    if (existingItem) {
      throw new ApiError(400, 'Inventory item name already exists');
    }

    inventory.name = name.trim();
  }

  if (category) {
    if (!mongoose.Types.ObjectId.isValid(category)) {
      throw new ApiError(400, 'Invalid categoryId');
    }

    const categoryDoc = await Category.findOne({
      _id: category,
      $or: [{ adminId }, { adminId: null }, { adminId: { $exists: false } }],
    });

    if (!categoryDoc) {
      throw new ApiError(400, 'Invalid category');
    }

    inventory.category = category;
  }

  if (unit) {
    inventory.unit = unit;
  }

  if (currentStock !== undefined) {
    inventory.currentStock = currentStock;
  }

  if (minStockLevel !== undefined) {
    inventory.minStockLevel = minStockLevel;
  }

  if (isActive !== undefined) {
    inventory.isActive = isActive;
  }

  await inventory.save();

  await updateMenusUsingInventory(inventory._id);

  return inventory;
};

export { createInventory, getInventoryList, getInventoryById, updateInventory };
