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

  getCustomers: async (filter, options) => {
     if (query.Customer) {
      filter.Customer = query.Customer;
    }
    if (query.search) {
      filter.name = { $regex: query.search, $options: "i" };
      filter.phoneNumber = { $regex: query.search, $options: "i" };
    }
    const result = await Customer.paginate(filter, options);
    return result;
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