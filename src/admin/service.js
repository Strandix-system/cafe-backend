import bcrypt from "bcrypt";
import User from "../../model/user.js";

const adminService = {
  createAdmin: async (data) => {
    const { firstName, lastName, cafeName, email, password } = data;

    if (!firstName || !lastName || !cafeName || !email || !password) {
      const err = new Error(
        "firstName, lastName, cafeName, email and password are required"
      );
      err.statusCode = 400;
      throw err;
    }

    const exists = await User.findOne({ email });
    if (exists) {
      const err = new Error("User already exists");
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      firstName,
      lastName,
      cafeName,
      email,
      password: hashedPassword,
      role: "admin",
    });

    return {
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      cafeName: admin.cafeName,
      email: admin.email,
      role: admin.role,
    };
  },

  updateAdmin: async (id, data) => {
    const { firstName, lastName, cafeName, email, password } = data;

    const admin = await User.findById(id);
    if (!admin || admin.role !== "admin") {
      const err = new Error("Admin not found");
      err.statusCode = 404;
      throw err;
    }

    if (email && email !== admin.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        const err = new Error("Email already in use");
        err.statusCode = 409;
        throw err;
      }
    }

    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (cafeName) admin.cafeName = cafeName;
    if (email) admin.email = email;
    if (password) admin.password = await bcrypt.hash(password, 10);

    await admin.save();

    return {
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      cafeName: admin.cafeName,
      email: admin.email,
      role: admin.role,
    };
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

  listAdmins: async (query) => {
    const filter = { role: "admin" };

    const options = {
      page: query.page || 0,
      limit: query.limit || 10,
      sortBy: query.sortBy || "createdAt:desc",
    };

    return await User.paginate(filter, options);
  },
};

export default adminService;
