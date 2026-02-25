import Customer from "../../../model/customer.js";

const customerService = {
  createCustomer: async (body) => {

    const { name, phoneNumber, adminId } = body;

    let customer = await Customer.findOne({
      phoneNumber,
    });
    if (customer) {
      customer.name = name;
      await customer.save();
      return customer;
    }
    const newCustomer = await Customer.create({
      name,
      phoneNumber,
      adminId,
    });
    return newCustomer.toObject();
  },

 getCustomers: async (filter, options, user) => {

  let adminId;

  if (user.role === "admin") {
    adminId = user._id;
  }

  if (user.role === "superadmin") {
    if (!filter.adminId) {
      throw Object.assign(
        new Error("adminId is required to view customers"),
        { statusCode: 400 }
      );
    }
    adminId = filter.adminId;
  }

  filter.adminId = adminId;

  if (filter.search) {
    filter.$or = [
      { name: { $regex: filter.search, $options: "i" } },
      { phoneNumber: { $regex: filter.search, $options: "i" } }
    ];
    delete filter.search;
  }

  options.page = Number(options.page) || 0;
  options.limit = Number(options.limit) || 10;

  return await Customer.paginate(filter, options);
},
  getCustomerById: async (id) => {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw Object.assign(new Error("Customer not found"), { statusCode: 404 });
    }
    return customer;
  },
  updateCustomer: async (id, data) => {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw Object.assign(new Error("Customer not found"), { statusCode: 404 });
    } else {
      Object.assign(customer, data);
      await customer.save();
      return customer;
    }
  },
  deleteCustomer: async (id) => {
    const customer = await Customer.findById(id);
    if (!customer) {
      throw Object.assign(new Error("Customer not found"), { statusCode: 404 });
    } else {
      await customer.deleteOne();
      return true;
    };
  },
};


export default customerService;