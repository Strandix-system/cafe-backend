import mongoose from 'mongoose';

import { ApiError } from '../../utils/apiError.js';
import { sendSuccessResponse } from '../../utils/response.js';

import {
  createSupplier,
  updateSupplier,
  getSupplierById,
  getSupplierList,
} from './supplier.service.js';

const createSupplierController = async (req, reply) => {
  const adminId = req.user?.adminId ?? req.user?._id;
  const userId = req.user?._id;

  const supplier = await createSupplier({
    adminId,
    userId,
    body: req.body,
  });

  return sendSuccessResponse(
    reply,
    201,
    'Supplier created successfully',
    supplier,
  );
};
const updateSupplierController = async (req, reply) => {
  const adminId = req.user?.adminId ?? req.user?._id;
  const userId = req.user?._id;
  const supplierId = req.params.id;

  if (!adminId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    throw new ApiError(400, 'Invalid supplierId');
  }

  const supplier = await updateSupplier({
    adminId,
    userId,
    supplierId,
    body: req.body,
  });

  return sendSuccessResponse(
    reply,
    200,
    'Supplier updated successfully',
    supplier,
  );
};
const getSupplierByIdController = async (req, reply) => {
  const adminId = req.user?.adminId ?? req.user?._id;

  const supplier = await getSupplierById({
    adminId,
    supplierId: req.params.id,
  });

  return sendSuccessResponse(
    reply,
    200,
    'Supplier fetched successfully',
    supplier,
  );
};
const getSupplierListController = async (req, reply) => {
  const adminId = req.user?.adminId ?? req.user?._id;

  if (!adminId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const suppliers = await getSupplierList({
    adminId,
    query: req.query,
  });

  return sendSuccessResponse(
    reply,
    200,
    'Suppliers fetched successfully',
    suppliers,
  );
};

export {
  createSupplierController,
  updateSupplierController,
  getSupplierByIdController,
  getSupplierListController,
};
