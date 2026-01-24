import bcrypt from "bcrypt";
import User from "../../model/user.js";

const adminService = {

  createAdmin: async (body) => {
    const exists = await User.findOne({ email:body.email });
    if (exists) {
      const err = new Error("User already exists");
      err.statusCode = 409;
      throw err;
    }
    const password = await bcrypt.hash(body.password, 10);
    const admin = await User.create({
  ...body,password,role:"admin"
    });
 const result =admin;
    return result;
  },
  updateAdmin: async (_id, data) => {
    const updatedAdmin = await User.findOneAndUpdate(
      { _id },        
      { $set: data }, 
      { new: true }   
    );
    if(!updatedAdmin){
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
listAdmins: async (options) => {
  const filter = { role: "admin" };
   if (filter.search) {
    const search = filter.search;
    const searchFilter = {
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { cafeName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        {
          phoneNumber: !isNaN(search)
            ? Number(search)
            : undefined,
        },
      ].filter(Boolean),
    }
    delete filter.search;
    filter = { ...filter, ...searchFilter };
  }
  const result = await User.paginate(filter, options);
  return result;
},
};

export default adminService;
