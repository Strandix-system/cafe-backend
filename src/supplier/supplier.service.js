import mongoose from 'mongoose';

import { Supplier } from '../../model/supplier.model.js';
import { ApiError } from '../../utils/apiError.js';

const createSupplier = async ({ adminId, userId, body }) => {
  return Supplier.create({
    adminId,
    createdBy: userId,
    name: body.name,
    phone: body.phone,
    email: body.email ?? '',
    address: body.address ?? '',
    gstNumber: body.gstNumber ?? '',
    note: body.note ?? '',
  });
};
const updateSupplier = async ({ adminId, userId, supplierId, body }) => {
  const { name, phone, email, address, gstNumber, note, isActive } = body;

  if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    throw new ApiError(400, 'Invalid supplierId');
  }

  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new ApiError(400, 'Invalid adminId');
  }

  const supplier = await Supplier.findOne({
    _id: supplierId,
    adminId,
  });

  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  if (name) {
    const existingSupplier = await Supplier.findOne({
      _id: { $ne: supplierId },
      adminId,
      name: name.trim(),
      isActive: true,
    });

    if (existingSupplier) {
      throw new ApiError(400, 'Supplier name already exists');
    }

    supplier.name = name.trim();
  }

  if (phone !== undefined) {
    supplier.phone = phone;
  }

  if (email !== undefined) {
    supplier.email = email;
  }

  if (address !== undefined) {
    supplier.address = address;
  }

  if (gstNumber !== undefined) {
    supplier.gstNumber = gstNumber;
  }

  if (note !== undefined) {
    supplier.note = note;
  }

  if (isActive !== undefined) {
    supplier.isActive = isActive;
  }

  supplier.updatedBy = userId;

  return supplier.save();
};
const getSupplierById = async ({ adminId, supplierId }) => {
  const supplier = await Supplier.findOne({
    _id: supplierId,
    adminId,
  }).lean();

  if (!supplier) {
    throw new ApiError(404, 'Supplier not found');
  }

  return supplier;
};
const getSupplierList = async ({ adminId, query }) => {
  const { search = '', isActive, page = 1, limit = 10 } = query;

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

  if (search?.trim()) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } },
      { gstNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const options = {
    page: Math.max(Number(page) - 1, 0), // 🔥 your pagination fix
    limit: Number(limit),
    sort: { createdAt: -1 },
    lean: true,
  };

  return Supplier.paginate(filter, options);
};

export { createSupplier, updateSupplier, getSupplierById, getSupplierList };
