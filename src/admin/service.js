import User from "../../model/user.js";

const adminService = {
  createAdmin: async (body, files) => {
    const exists = await User.findOne({ email: body.email });
    if (exists) {
      throw Object.assign(new Error("User already exists"), { statusCode: 409 });
    }

    const phoneExists = await User.findOne({ phoneNumber: body.phoneNumber });
    if (phoneExists) {
      throw Object.assign(new Error("PhoneNumber already exists"), { statusCode: 409 });
    }
    if (!files || !files.logo || files.logo.length === 0) {
      throw Object.assign(new Error("Logo is required"), { statusCode: 400 });
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
    if (!admin) throw Object.assign(new Error("Admin not found"), { statusCode: 404 });
    const uniqueFields = ['email', 'phoneNumber'];
    for (const field of uniqueFields) {
      if (body[field] && body[field] !== admin[field]) {
        const exists = await User.findOne({ [field]: body[field] });
        if (exists) throw Object.assign(new Error(`${field} already exists`), { statusCode: 409 });
      }
    }
    if (files) {
      const fileFields = ['logo', 'profileImage'];
      for (const key of fileFields) {
        const newFile = files[key]?.[0];
        const oldFileUrl = admin[key];
        if (newFile?.location) {
          if (oldFileUrl) {
            try {
              await deleteSingleFile(oldFileUrl);
              console.log(`✅ Old ${key} deleted successfully`);
            } catch (err) {
              console.error(`❌ Failed to delete old ${key}:`, err.message);
            }
          }
          body[key] = newFile.location;
        }
      }
    }
    if (body.password) body.password = await bcrypt.hash(body.password, 10);
    return await User.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
  },
  deleteAdmin: async (id) => {
    const admin = await User.findOneAndDelete({
      _id: id,
      role: "admin",
    });
    if (!admin) {
      const err = new Error("Admin not found");
      err.statusCode = 404;
      throw err;
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
        { state: { $regex: filter.search, $options: "i" } },
        { city: { $regex: filter.search, $options: "i" } },
      ];
    }
    delete filter.search;
    const result = await User.paginate(query, options);
    return result;
  },
  getByAdmin: async (adminId) => {
    const admin = await User.findById({
      _id: adminId,
      role: "admin",
    }).select("-password");
    if (!admin) {
      throw new Error("Admin not found");
    }
    return admin;
  }
};

export default adminService;
