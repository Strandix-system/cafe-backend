import mongoose from 'mongoose';

import { Inventory } from '../../model/inventory.model.js';
import { Supplier } from '../../model/supplier.model.js';
import { InventoryPurchase } from '../../model/supplierPurchase.model.js';
import { ApiError } from '../../utils/apiError.js';
import { convertToBaseUnit } from '../../utils/utils.js';

const unitTypeMap = {
  ml: 'volume',
  l: 'volume',
  g: 'weight',
  kg: 'weight',
  pcs: 'count',
  dozen: 'count',
};

const baseUnitMap = {
  ml: 'ml',
  l: 'ml',

  g: 'g',
  kg: 'g',

  pcs: 'pcs',
  dozen: 'pcs',
};

const createPurchase = async (body = {}) => {
  const {
    adminId,
    supplierId,
    invoiceNumber,
    totalAmount,
    purchasedAt,
    note,
    items,
    createdBy,
  } = body;

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ApiError(400, 'Invalid adminId');
  }

  if (!items || items.length === 0) {
    throw new ApiError(400, 'Items are required');
  }

  const supplier = await Supplier.findOne({
    _id: supplierId,
    adminId,
  });

  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  const updatedItems = [];

  for (const item of items) {
    const inventory = await Inventory.findOne({
      _id: item.inventoryItemId,
      adminId,
    });

    if (!inventory) {
      throw new ApiError(404, 'Inventory item not found');
    }

    if (!unitTypeMap[item.unit] || !unitTypeMap[inventory.unit]) {
      throw new ApiError(400, 'Invalid unit provided');
    }

    if (unitTypeMap[item.unit] !== unitTypeMap[inventory.unit]) {
      throw new ApiError(400, 'Unit type mismatch');
    }

    if (!baseUnitMap[item.unit]) {
      throw new ApiError(400, 'Invalid unit for conversion');
    }

    const convertedQty = convertToBaseUnit(Number(item.quantity), item.unit);

    if (unitTypeMap[inventory.unit] !== unitTypeMap[item.unit]) {
      throw new ApiError(400, 'Inventory unit type mismatch');
    }

    inventory.currentStock += convertedQty;
    await inventory.save();

    updatedItems.push({
      ...item,
      baseUnit: baseUnitMap[item.unit],
      convertedQuantity: convertedQty,
    });
  }

  const purchase = await InventoryPurchase.create({
    adminId,
    supplierId,
    invoiceNumber,
    totalAmount,
    purchasedAt,
    note,
    items: updatedItems,
    createdBy,
  });

  return purchase;
};

const getPurchaseList = async (query = {}) => {
  const { adminId, search = '', supplierId, page = 0, limit = 10 } = query;

  const filter = { adminId };

  if (supplierId) {
    filter.supplierId = supplierId;
  }

  if (search) {
    filter.invoiceNumber = {
      $regex: search,
      $options: 'i',
    };
  }

  const options = {
    page: Number(page),
    limit: Number(limit),
    sort: { createdAt: -1 },
    lean: true,
    populate: [
      {
        path: 'supplierId',
        select: 'name phone',
      },
      {
        path: 'items.inventoryItemId',
        select: 'name image unit',
      },
    ],
  };

  return await InventoryPurchase.paginate(filter, options);
};

const getPurchaseById = async ({ purchaseId, adminId }) => {
  const purchase = await InventoryPurchase.findOne({
    _id: purchaseId,
    adminId,
  }).populate([
    {
      path: 'supplierId',
      select: 'name phone email',
    },
    {
      path: 'items.inventoryItemId',
      select: 'name image currentStock unit',
    },
  ]);

  if (!purchase) {
    throw new ApiError(404, 'Purchase not found');
  }

  return purchase;
};

export { createPurchase, getPurchaseList, getPurchaseById };
