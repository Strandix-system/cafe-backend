import User from "../../model/user.js";
import { deleteSingleFile } from "../../utils/s3utils.js";
import { ApiError } from "../../utils/apiError.js";
import bcrypt from "bcryptjs";

const adminService = {
  createAdmin: async (body, files) => {
    const exists = await User.findOne({ email: body.email });
    if (exists) {
      throw new ApiError(409, "User already exists");
    }
    const phoneExists = await User.findOne({ phoneNumber: body.phoneNumber });
    if (phoneExists) {
      throw new ApiError(409, "PhoneNumber already exists");
    }
    if (!files || !files.logo || files.logo.length === 0) {
      throw new ApiError(400, "Logo is required");
    }

    const admin = await User.create({
      ...body,
      role: "admin",
      logo: files.logo[0].location,
      profileImage: files?.profileImage?.[0]?.location || null
    });
    return admin;
  },
  updateAdmin: async (id, body, files) => {
    const admin = await User.findById(id);
    if (!admin)
      throw new ApiError(404, "Admin not found");

    // ✅ Unique field check
    const uniqueFields = ['email', 'phoneNumber'];
    for (const field of uniqueFields) {
      if (body[field] && body[field] !== admin[field]) {
        const exists = await User.findOne({ [field]: body[field] });
        if (exists)
          throw new ApiError(409, `${field} already exists`);
      }
    }

    // ✅ Merge nested object fields (LIKE hours, socialLinks)
    const nestedFields = ['hours', 'socialLinks', 'address', 'gst'];

    nestedFields.forEach(field => {
      if (body[field]) {
        const parsedData =
          typeof body[field] === 'string'
            ? JSON.parse(body[field])
            : body[field];

        if (field === "gst") {
          const hasGstNumberInPayload = Object.prototype.hasOwnProperty.call(parsedData, "gstNumber");
          const incomingGstNumber = typeof parsedData.gstNumber === "string"
            ? parsedData.gstNumber.trim()
            : parsedData.gstNumber;

          if (hasGstNumberInPayload && (incomingGstNumber === "" || incomingGstNumber === null)) {
            admin.gst = {
              ...(admin.gst?.toObject?.() || admin.gst || {}),
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
          ...(admin[field]?.toObject?.() || admin[field] || {}),
          ...parsedData,
        };

        delete body[field];
      }
    });

    // ✅ File handling
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
              console.error(`❌ Failed to delete old ${key}:`, err.message);
            }
          }
          admin[key] = newFile.location; // directly assign to admin
        }
      }
    }

    // ✅ Password hashing
    if (body.password) {
      admin.password = await bcrypt.hash(body.password, 10);
      delete body.password;
    }

    // ✅ Assign remaining simple fields
    Object.assign(admin, body);

    await admin.save();

    return admin;
  },
  deleteAdmin: async (id) => {
    const admin = await User.findOneAndDelete({
      _id: id,
      role: "admin",
    });
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }
    return true;
  },
  listAdmins: async (filter, options) => {
    const query = { role: "admin" };
    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    }
    if (filter.search) {
      query.$or = [
        { firstName: { $regex: filter.search, $options: "i" } },
        { lastName: { $regex: filter.search, $options: "i" } },
        { cafeName: { $regex: filter.search, $options: "i" } },
        { email: { $regex: filter.search, $options: "i" } },
        { "address.state": { $regex: filter.search, $options: "i" } },
        { "address.city": { $regex: filter.search, $options: "i" } },
      ];
    }
    delete filter.search;
    const result = await User.paginate(query, options);
    return result;
  },
  getByAdmin: async (adminId) => {
    const admin = await User.findOne({
      _id: adminId,
      role: "admin",
    }).lean();;

    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    return admin;
  },
  updateAdminStatus: async (adminId, isActive) => {
    const admin = await User.findOneAndUpdate(
      { _id: adminId, role: "admin" },
      { isActive },
      { new: true }
    );

    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }
    return admin;
  },
 updateSuperAdmin: async (id, body, files) => {
  const superadmin = await User.findById(id);

  if (!superadmin) {
    throw new ApiError(404, "Admin not found");
  }

  // 🔐 Only allow specific fields
  const allowedFields = ["firstName", "lastName", "email", "phoneNumber"];

  // ✅ Unique check (with self exclusion)
  for (const field of ["email", "phoneNumber"]) {
    if (body[field] && body[field] !== superadmin[field]) {
      const exists = await User.findOne({
        [field]: body[field],
        _id: { $ne: id }
      });

      if (exists) {
        throw new ApiError(409, `${field} already exists`);
      }
    }
  }

  // ✅ Assign only allowed fields
  allowedFields.forEach(field => {
    if (body[field] !== undefined) {
      superadmin[field] = body[field];
    }
  });

  // ✅ Profile Image handling
  if (files?.profileImage?.[0]) {
    const newFile = files.profileImage[0];
    const oldFileUrl = superadmin.profileImage;

    if (newFile?.location) {
      if (oldFileUrl) {
        try {
          await deleteSingleFile(oldFileUrl);
        } catch (err) {
          console.error("❌ Failed to delete old profileImage:", err.message);
        }
      }

      superadmin.profileImage = newFile.location;
    }
  }

  await superadmin.save();

  return superadmin;
},
};

export default adminService;
