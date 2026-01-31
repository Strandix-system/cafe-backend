import bcrypt from "bcrypt";
import User from "../../model/user.js";

const adminService = {

  createAdmin: async (body) => {
    const exists = await User.findOne({ email: body.email });
    if (exists) {
      const err = new Error("User already exists");
      err.statusCode = 409;
      throw err;
    }
    const isexists = await User.findOne({ phoneNumber: body.phoneNumber });
    if (isexists) {
      const err = new Error("PhoneNumber is already exist");
      err.statusCode = 409;
      throw err;
    }
    // const password = await bcrypt.hash(body.password, 10);
    const admin = await User.create({
      ...body,role: "admin"
    });
    const result = admin;
    return result;
  },
  updateAdmin: async (id, data) => {
    const updatedAdmin = await User.findOneAndUpdate(
      { _id: id },
      { $set: data },
      { new: true }
    );
    if (!updatedAdmin) {
      throw new Error("Internal server Error", 500)
    }
    return updatedAdmin;
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
  }

};

export default adminService;
