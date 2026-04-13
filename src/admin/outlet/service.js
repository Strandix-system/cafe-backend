import User from '../../../model/user.js';
import { ApiError } from '../../../utils/apiError.js';
import { deleteSingleFile } from '../../../utils/s3utils.js';

export const outletService = {
  createOutletManager: async (parentAdmin, body, files) => {
    if (!parentAdmin?._id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (parentAdmin.role !== 'admin') {
      throw new ApiError(403, 'Access denied');
    }

    const email = body.email;
    const outletCode = body.outletCode;

    const existingByEmail = await User.findOne({ email }).select('_id');
    if (existingByEmail) {
      throw new ApiError(409, 'User already exists');
    }

    if (outletCode) {
      const existingByCode = await User.findOne({
        role: 'outlet_manager',
        parentAdminId: parentAdmin._id,
        outletCode,
      }).select('_id');
      if (existingByCode) {
        throw new ApiError(409, 'Outlet code already exists');
      }
    }
    let logo = null;
    let profileImage = null;

    try {
      logo = files?.logo?.[0]?.location || null;
      profileImage = files?.profileImage?.[0]?.location || null;

      const outletManager = await User.create({
        firstName: body.firstName,
        lastName: body.lastName,
        email,
        phoneNumber: body.phoneNumber ?? null,
        password: body.password,
        role: 'outlet_manager',
        parentAdminId: parentAdmin._id,
        cafeName: parentAdmin.cafeName ?? null,
        outletName: body.outletName ?? null,
        outletCode: outletCode ?? null,
        address: body.address ?? null,
        hours: body.hours ?? null,
        socialLinks: body.socialLinks ?? null,
        gst: parentAdmin.gst?.gstNumber
          ? {
              gstNumber: parentAdmin.gst.gstNumber,
              gstPercentage: parentAdmin.gst.gstPercentage,
              gstType: parentAdmin.gst.gstType,
            }
          : null,
        logo,
        profileImage,
      });

      return await User.findById(outletManager._id);
    } catch (error) {
      if (logo) await deleteSingleFile(logo);
      if (profileImage) await deleteSingleFile(profileImage);
      throw error;
    }
  },

  listOutlets: async (parentAdminId, filter = {}, options = {}) => {
    const query = {
      role: 'outlet_manager',
      parentAdminId,
    };

    if (filter.search) {
      query.$or = [
        { firstName: { $regex: filter.search, $options: 'i' } },
        { lastName: { $regex: filter.search, $options: 'i' } },
        { email: { $regex: filter.search, $options: 'i' } },
        { outletName: { $regex: filter.search, $options: 'i' } },
        { outletCode: { $regex: filter.search, $options: 'i' } },
        { 'outletAddress.city': { $regex: filter.search, $options: 'i' } },
        { 'outletAddress.state': { $regex: filter.search, $options: 'i' } },
      ];
    }

    const page = Number(options.page) || 0;
    const limit = Number(options.limit) || 10;

    const sort = options.sortBy
      ? options.sortBy.split(',').reduce((acc, pair) => {
          const [key, direction] = pair.split(':');
          acc[key] = direction === 'desc' ? -1 : 1;
          return acc;
        }, {})
      : { createdAt: -1 };

    const [results, totalResults] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip(page * limit)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return {
      results,
      page,
      limit,
      totalResults,
      totalPages: Math.ceil(totalResults / limit),
    };
  },

  updateOutletManager: async (parentAdmin, outletId, body, files) => {
    if (!parentAdmin?._id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (parentAdmin.role !== 'admin') {
      throw new ApiError(403, 'Access denied');
    }

    const outlet = await User.findOne({
      _id: outletId,
      role: 'outlet_manager',
      parentAdminId: parentAdmin._id,
    });

    if (!outlet) {
      throw new ApiError(404, 'Outlet not found');
    }

    if (body.email) {
      const email = body.email;
      if (email !== outlet.email) {
        const exists = await User.findOne({ email }).select('_id');
        if (exists) {
          throw new ApiError(409, 'Email already exists');
        }
        outlet.email = email;
      }
    }

    if (body.outletCode) {
      const outletCode =
        typeof body.outletCode === 'string' ? body.outletCode.trim() : null;
      if (outletCode && outletCode !== outlet.outletCode) {
        const exists = await User.findOne({
          role: 'outlet_manager',
          parentAdminId: parentAdmin._id,
          outletCode,
          _id: { $ne: outlet._id },
        }).select('_id');
        if (exists) {
          throw new ApiError(409, 'Outlet code already exists');
        }
        outlet.outletCode = outletCode;
      }
    }

    if (body.password) outlet.password = body.password;

    if (body.firstName !== undefined) outlet.firstName = body.firstName;
    if (body.lastName !== undefined) outlet.lastName = body.lastName;
    if (body.isActive !== undefined) outlet.isActive = body.isActive;
    if (body.outletName !== undefined) outlet.outletName = body.outletName;
    if (body.outletAddress !== undefined) {
      outlet.outletAddress = {
        ...(outlet.outletAddress?.toObject?.() ?? outlet.outletAddress ?? {}),
        ...body.outletAddress,
      };
    }
    if (files) {
      const fileFields = ['logo', 'profileImage'];

      for (const key of fileFields) {
        const newFile = files[key]?.[0];
        const oldFileUrl = outlet[key]; // ⚠️ change admin → outlet

        if (newFile?.location) {
          if (oldFileUrl) {
            try {
              await deleteSingleFile(oldFileUrl);
            } catch (err) {
              console.error(`❌ Failed to delete old ${key}:`, err.message);
            }
          }

          outlet[key] = newFile.location;
        }
      }
    }

    await outlet.save();
    return outlet;
  },

  deleteOutletManager: async (parentAdmin, outletId) => {
    if (!parentAdmin?._id) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (parentAdmin.role !== 'admin') {
      throw new ApiError(403, 'Access denied');
    }

    const deleted = await User.findOneAndDelete({
      _id: outletId,
      role: 'outlet_manager',
      parentAdminId: parentAdmin._id,
    });

    if (!deleted) {
      throw new ApiError(404, 'Outlet not found');
    }

    return true;
  },
};
