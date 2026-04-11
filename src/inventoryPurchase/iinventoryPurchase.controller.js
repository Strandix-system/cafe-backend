import mongoose from 'mongoose';

import { ApiError } from '../../utils/apiError.js';
import { sendSuccessResponse } from '../../utils/response.js';

import {
  createPurchase,
  getPurchaseList,
  getPurchaseById,
} from './inventoryPurchase.service.js';

const createPurchaseController = async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const purchase = await createPurchase({
    ...req.body,
    adminId: req.user.adminId || req.user._id,
    createdBy: req.user._id,
  });

  sendSuccessResponse(res, 201, 'Purchase created successfully', purchase);
};

const getPurchaseListController = async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const purchaseList = await getPurchaseList({
    ...req.query,
    adminId: req.user.adminId || req.user._id,
  });

  sendSuccessResponse(res, 200, 'Purchase list fetched successfully', {
    totalDocs: purchaseList.totalResults,
    totalPages: purchaseList.totalPages,
    currentPage: purchaseList.page,
    limit: purchaseList.limit,
    results: purchaseList.results,
  });
};

const getPurchaseByIdController = async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.purchaseId)) {
    throw new ApiError(400, 'Invalid purchaseId');
  }

  const purchase = await getPurchaseById({
    purchaseId: req.params.purchaseId,
    adminId: req.user.adminId || req.user._id,
  });

  sendSuccessResponse(
    res,
    200,
    'Purchase details fetched successfully',
    purchase,
  );
};

export {
  createPurchaseController,
  getPurchaseListController,
  getPurchaseByIdController,
};
