import mongoose from 'mongoose';

import { Category } from '../../model/category.js';
import { Inventory } from '../../model/inventory.model.js';
import { ApiError } from '../../utils/apiError.js';
import { STOCK_TYPES, PURCHASE_UNIT_ENUM } from '../../utils/constants.js';
import { updateMenusUsingInventory } from '../../utils/inventory.helper.js';
import { convertToBaseUnit } from '../../utils/utils.js';

const { isValidObjectId } = mongoose;

const baseUnitMap = {
  ml: 'ml',
  l: 'ml',
  g: 'g',
  kg: 'g',
  pcs: 'pcs',
  dozen: 'pcs',
};

const createInventory = async (body = {}) => {
  const { adminId, name, image, category, unit, currentStock, minStockLevel } =
    body;

  if (!adminId) {
    throw new ApiError(400, 'adminId is required');
  }

  if (!isValidObjectId(adminId)) {
    throw new ApiError(400, 'Invalid adminId');
  }

  if (!name?.trim()) {
    throw new ApiError(400, 'Item name is required');
  }

  if (!isValidObjectId(category)) {
    throw new ApiError(400, 'Invalid categoryId');
  }

  if (!PURCHASE_UNIT_ENUM.includes(unit)) {
    throw new ApiError(
      400,
      `Invalid unit. Allowed units are: ${PURCHASE_UNIT_ENUM.join(', ')}`,
    );
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

  const convertedStock = convertToBaseUnit(Number(currentStock ?? 0), unit);

  const convertedMinStock = convertToBaseUnit(Number(minStockLevel ?? 0), unit);

  const inventory = await Inventory.create({
    adminId,
    name: name.trim(),
    image: image ?? null,
    category,
    unit: baseUnitMap[unit],
    currentStock: convertedStock,
    minStockLevel: convertedMinStock,
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

  if (!isValidObjectId(adminId)) {
    throw new ApiError(400, 'Invalid adminId');
  }

  const filter = {
    adminId,
    isActive: isActive !== undefined ? isActive === 'true' : true,
  };

  if (search) {
    filter.name = {
      $regex: search,
      $options: 'i',
    };
  }

  if (category) {
    if (!isValidObjectId(category)) {
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

  if (!isValidObjectId(inventoryId)) {
    throw new ApiError(400, 'Invalid inventoryId');
  }

  if (!isValidObjectId(adminId)) {
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

  if (!isValidObjectId(inventoryId)) {
    throw new ApiError(400, 'Invalid inventoryId');
  }

  if (!isValidObjectId(adminId)) {
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
    inventory.image = image ?? null;
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
    if (!isValidObjectId(category)) {
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
    if (!PURCHASE_UNIT_ENUM.includes(unit)) {
      throw new ApiError(
        400,
        `Invalid unit. Allowed units are: ${PURCHASE_UNIT_ENUM.join(', ')}`,
      );
    }

    inventory.unit = baseUnitMap[unit];
  }

  if (currentStock !== undefined) {
    inventory.currentStock = convertToBaseUnit(
      Number(currentStock),
      unit ?? inventory.unit,
    );
  }

  if (minStockLevel !== undefined) {
    inventory.minStockLevel = convertToBaseUnit(
      Number(minStockLevel),
      unit ?? inventory.unit,
    );
  }

  if (isActive !== undefined) {
    inventory.isActive = isActive;
  }

  await inventory.save();

  await updateMenusUsingInventory(inventory._id);

  return inventory;
};

export { createInventory, getInventoryList, getInventoryById, updateInventory };
