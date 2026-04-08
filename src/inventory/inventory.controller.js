import { sendSuccessResponse } from '../../utils/response.js';

import {
  createInventory,
  getInventoryList,
  getInventoryById,
  updateInventory,
} from './inventory.service.js';

const createInventoryController = async (req, res) => {
  const inventory = await createInventory({
    ...req.body,
    adminId: req.user.adminId || req.user._id,
    image: req.file ? req.file.location : null,
  });

  sendSuccessResponse(
    res,
    201,
    'Inventory item created successfully',
    inventory,
  );
};

const getInventoryListController = async (req, res) => {
  const inventoryList = await getInventoryList({
    ...req.query,
    adminId: req.user.adminId || req.user._id,
  });

  sendSuccessResponse(res, 200, 'Inventory list fetched successfully', {
    totalDocs: inventoryList.totalResults,
    totalPages: inventoryList.totalPages,
    currentPage: inventoryList.page,
    limit: inventoryList.limit,
    results: inventoryList.results,
  });
};

const getInventoryByIdController = async (req, res) => {
  const inventory = await getInventoryById({
    inventoryId: req.params.id,
    adminId: req.user.adminId || req.user._id,
  });

  sendSuccessResponse(
    res,
    200,
    'Inventory item fetched successfully',
    inventory,
  );
};

const updateInventoryController = async (req, res) => {
  const inventory = await updateInventory({
    inventoryId: req.params.id,
    adminId: req.user.adminId || req.user._id,
    body: {
      ...req.body,
      image: req.file ? req.file.location : undefined,
    },
  });

  sendSuccessResponse(
    res,
    200,
    'Inventory item updated successfully',
    inventory,
  );
};

export {
  createInventoryController,
  getInventoryListController,
  getInventoryByIdController,
  updateInventoryController,
};
