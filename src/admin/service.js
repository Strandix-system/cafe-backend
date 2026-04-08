import bcrypt from 'bcryptjs';

import Outlet from '../../model/outlet.js';
import User from '../../model/user.js';
import { ApiError } from '../../utils/apiError.js';
import { deleteSingleFile } from '../../utils/s3utils.js';

const buildSearchRegex = (value) => ({
  $regex: value,
  $options: 'i',
});

const ensureMainOutletForAdmin = async (admin) => {
  if (!admin?._id) {
    throw new ApiError(404, 'Admin not found');
  }

  const existingMainOutlet = await Outlet.findOne({
    adminId: admin._id,
    isMain: true,
  });

  if (existingMainOutlet) {
    return existingMainOutlet;
  }

  return await Outlet.create({
    adminId: admin._id,
    name: admin.cafeName ?? 'Main Outlet',
    email: admin.email ?? null,
    phoneNumber: admin.phoneNumber ?? null,
    address: admin.address ?? null,
    hours: admin.hours ?? null,
    isMain: true,
    isActive: admin.isActive ?? true,
  });
};

const adminService = {
  createAdmin: async (body, files) => {
    const exists = await User.findOne({ email: body.email });
    if (exists) {
      throw new ApiError(409, 'User already exists');
    }
    const phoneExists = await User.findOne({ phoneNumber: body.phoneNumber });
    if (phoneExists) {
      throw new ApiError(409, 'PhoneNumber already exists');
    }
    if (!files || !files.logo || files.logo.length === 0) {
      throw new ApiError(400, 'Logo is required');
    }

    const admin = await User.create({
      ...body,
      role: 'admin',
      logo: files.logo[0].location,
      profileImage: files?.profileImage?.[0]?.location || null,
    });

    await ensureMainOutletForAdmin(admin);
    return admin;
  },
  createOutletManager: async (currentUser, body) => {
    if (currentUser?.role !== 'admin') {
      throw new ApiError(403, 'Only admin can create outlet manager');
    }

    const creator = await User.findById(currentUser._id).select(
      'role cafeName gst socialLinks profileImage logo email phoneNumber address hours isActive',
    );
    if (!creator) {
      throw new ApiError(404, 'Creator admin not found');
    }

    await ensureMainOutletForAdmin(creator);

    const outletNameExists = await Outlet.findOne({
      adminId: creator._id,
      name: { $regex: new RegExp(`^${body.outletName}$`, 'i') },
    });
    if (outletNameExists) {
      throw new ApiError(409, 'Outlet name already exists');
    }

    const exists = await User.findOne({ email: body.email });
    if (exists) {
      throw new ApiError(409, 'User already exists');
    }

    const phoneExists = await User.findOne({ phoneNumber: body.phoneNumber });
    if (phoneExists) {
      throw new ApiError(409, 'PhoneNumber already exists');
    }

    const manager = await User.create({
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      email: body.email,
      password: body.password,
      cafeName: body.outletName,
      address: body.address,
      hours: body.hours,
      role: 'manager',
      adminId: creator._id,
      outletId: null,
      gst: creator.gst?.toObject?.() ?? creator.gst ?? null,
      socialLinks:
        creator.socialLinks?.toObject?.() ?? creator.socialLinks ?? null,
      profileImage: creator.profileImage ?? null,
      logo: creator.logo ?? null,
    });

    const outlet = await Outlet.create({
      adminId: creator._id,
      managerId: manager._id,
      name: body.outletName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      address: body.address,
      hours: body.hours,
      isMain: false,
      isActive: true,
    });

    manager.outletId = outlet._id;
    await manager.save();

    return {
      outlet,
      manager,
    };
  },

  getOutlets: async (adminId, filter, options) => {
    const admin = await User.findById(adminId).select(
      'cafeName email phoneNumber address hours isActive',
    );

    if (admin) {
      await ensureMainOutletForAdmin(admin);
    }

    const query = {
      adminId,
    };

    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }

    if (filter.search) {
      query.$or = [
        { name: buildSearchRegex(filter.search) },
        { email: buildSearchRegex(filter.search) },
        { 'address.city': buildSearchRegex(filter.search) },
        { 'address.state': buildSearchRegex(filter.search) },
      ];
    }

    return await Outlet.paginate(query, {
      ...options,
      populate: 'managerId',
    });
  },
  getOutletById: async (id) => {
    const outlet = await Outlet.findById(id).populate(
      'managerId',
      'firstName lastName email phoneNumber isActive profileImage outletId',
    );

    if (!outlet) {
      throw new ApiError(404, 'Outlet not found');
    }

    return outlet;
  },

  updateOutlet: async (id, body) => {
    const outlet = await Outlet.findById(id).populate(
      'managerId',
      'firstName lastName email phoneNumber isActive address hours',
    );

    if (!outlet) {
      throw new ApiError(404, 'Outlet not found');
    }

    const manager = outlet.managerId
      ? await User.findById(outlet.managerId._id)
      : null;

    if (body.outletName && body.outletName !== outlet.name) {
      const outletNameExists = await Outlet.findOne({
        adminId: outlet.adminId,
        name: { $regex: new RegExp(`^${body.outletName}$`, 'i') },
        _id: { $ne: outlet._id },
      });

      if (outletNameExists) {
        throw new ApiError(409, 'Outlet name already exists');
      }
    }

    if (body.email && body.email !== outlet.email) {
      const outletEmailExists = await Outlet.findOne({
        email: body.email,
        _id: { $ne: id },
      });
      if (outletEmailExists) {
        throw new ApiError(409, 'Outlet email already exists');
      }
    }

    if (body.phoneNumber && body.phoneNumber !== outlet.phoneNumber) {
      const outletPhoneExists = await Outlet.findOne({
        phoneNumber: body.phoneNumber,
        _id: { $ne: id },
      });
      if (outletPhoneExists) {
        throw new ApiError(409, 'Outlet phone number already exists');
      }
    }

    if (body.address) {
      outlet.address = {
        ...(outlet.address || {}),
        ...body.address,
      };
    }

    if (body.hours) {
      outlet.hours = {
        ...(outlet.hours || {}),
        ...body.hours,
      };
    }

    if (body.outletName) {
      outlet.name = body.outletName;
    }

    for (const field of ['email', 'phoneNumber', 'isActive']) {
      if (body[field] !== undefined) {
        outlet[field] = body[field];
      }
    }

    await outlet.save();

    if (manager) {
      if (body.firstName !== undefined) manager.firstName = body.firstName;
      if (body.lastName !== undefined) manager.lastName = body.lastName;
      if (body.email !== undefined) manager.email = body.email;
      if (body.phoneNumber !== undefined) manager.phoneNumber = body.phoneNumber;
      if (body.isActive !== undefined) manager.isActive = body.isActive;
      if (body.address) {
        manager.address = {
          ...(manager.address || {}),
          ...body.address,
        };
      }
      if (body.hours) {
        manager.hours = {
          ...(manager.hours || {}),
          ...body.hours,
        };
      }
      if (body.password) {
        manager.password = await bcrypt.hash(body.password, 10);
      }
      if (body.outletName) {
        manager.cafeName = body.outletName;
      }

      await manager.save();
    }

    return await Outlet.findById(id).populate(
      'managerId',
      'firstName lastName email phoneNumber isActive profileImage outletId',
    );
  },
  updateAdmin: async (id, body, files) => {
    const admin = await User.findById(id);
    if (!admin) throw new ApiError(404, 'Admin not found');

    const uniqueFields = ['email', 'phoneNumber'];
    for (const field of uniqueFields) {
      if (body[field] && body[field] !== admin[field]) {
        const exists = await User.findOne({ [field]: body[field] });
        if (exists) throw new ApiError(409, `${field} already exists`);
      }
    }

    const nestedFields = ['hours', 'socialLinks', 'address', 'gst'];

    nestedFields.forEach((field) => {
      if (body[field]) {
        const parsedData =
          typeof body[field] === 'string'
            ? JSON.parse(body[field])
            : body[field];

        if (field === 'gst') {
          const hasGstNumberInPayload = Object.prototype.hasOwnProperty.call(
            parsedData,
            'gstNumber',
          );
          const incomingGstNumber =
            typeof parsedData.gstNumber === 'string'
              ? parsedData.gstNumber.trim()
              : parsedData.gstNumber;

          if (hasGstNumberInPayload && (incomingGstNumber ?? '') === '') {
            admin.gst = {
              ...(admin.gst?.toObject?.() ?? admin.gst ?? {}),
              ...parsedData,
              gstNumber: null,
              gstPercentage: null,
              gstType: null,
            };

            delete body[field];
            return;
          }
        }

        admin[field] = {
          ...(admin[field]?.toObject?.() ?? admin[field] ?? {}),
          ...parsedData,
        };

        delete body[field];
      }
    });

    if (files) {
      const fileFields = ['logo', 'profileImage'];
      for (const key of fileFields) {
        const newFile = files[key]?.[0];
        const oldFileUrl = admin[key];

        if (newFile?.location) {
          if (oldFileUrl) {
            try {
              await deleteSingleFile(oldFileUrl);
            } catch (err) {
              console.error(`Failed to delete old ${key}:`, err.message);
            }
          }
          admin[key] = newFile.location;
        }
      }
    }

    if (body.password) {
      admin.password = await bcrypt.hash(body.password, 10);
      delete body.password;
    }

    Object.assign(admin, body);

    await admin.save();
    await ensureMainOutletForAdmin(admin);

    if (admin.cafeName || admin.email || admin.phoneNumber || body.address || body.hours) {
      await Outlet.findOneAndUpdate(
        { adminId: admin._id, isMain: true },
        {
          $set: {
            name: admin.cafeName ?? 'Main Outlet',
            email: admin.email ?? null,
            phoneNumber: admin.phoneNumber ?? null,
            address: admin.address ?? null,
            hours: admin.hours ?? null,
            isActive: admin.isActive,
          },
        },
      );
    }

    return admin;
  },
  deleteAdmin: async (id) => {
    const admin = await User.findOneAndDelete({
      _id: id,
      role: 'admin',
    });
    if (!admin) {
      throw new ApiError(404, 'Admin not found');
    }
    return true;
  },
  listAdmins: async (filter, options) => {
    const query = { role: 'admin' };
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    if (filter.search) {
      query.$or = [
        { firstName: { $regex: filter.search, $options: 'i' } },
        { lastName: { $regex: filter.search, $options: 'i' } },
        { cafeName: { $regex: filter.search, $options: 'i' } },
        { email: { $regex: filter.search, $options: 'i' } },
        { 'address.state': { $regex: filter.search, $options: 'i' } },
        { 'address.city': { $regex: filter.search, $options: 'i' } },
      ];
    }
    delete filter.search;
    const result = await User.paginate(query, options);
    return result;
  },
  getByAdmin: async (adminId) => {
    const admin = await User.findOne({
      _id: adminId,
      role: 'admin',
    }).lean();

    if (!admin) {
      throw new ApiError(404, 'Admin not found');
    }

    return admin;
  },
  updateAdminStatus: async (adminId, isActive) => {
    const admin = await User.findOneAndUpdate(
      { _id: adminId, role: 'admin' },
      { isActive },
      { new: true },
    );

    if (!admin) {
      throw new ApiError(404, 'Admin not found');
    }

    await Outlet.findOneAndUpdate(
      { adminId: admin._id, isMain: true },
      { $set: { isActive } },
    );

    return admin;
  },
  updateSuperAdmin: async (id, body, files) => {
    const superadmin = await User.findById(id);

    if (!superadmin) {
      throw new ApiError(404, 'Admin not found');
    }

    const allowedFields = ['firstName', 'lastName', 'email', 'phoneNumber'];

    for (const field of ['email', 'phoneNumber']) {
      if (body[field] && body[field] !== superadmin[field]) {
        const exists = await User.findOne({
          [field]: body[field],
          _id: { $ne: id },
        });

        if (exists) {
          throw new ApiError(409, `${field} already exists`);
        }
      }
    }

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        superadmin[field] = body[field];
      }
    });

    if (files?.profileImage?.[0]) {
      const newFile = files.profileImage[0];
      const oldFileUrl = superadmin.profileImage;

      if (newFile?.location) {
        if (oldFileUrl) {
          try {
            await deleteSingleFile(oldFileUrl);
          } catch (err) {
            console.error('Failed to delete old profileImage:', err.message);
          }
        }

        superadmin.profileImage = newFile.location;
      }
    }

    await superadmin.save();

    return superadmin;
  },
};

export { ensureMainOutletForAdmin };
export default adminService;
