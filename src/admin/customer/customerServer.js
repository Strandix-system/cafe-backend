import Customer from "../../../model/customer.js";

const customerService = {
  createCustomer: async (data) => {
    return await Customer.create(data);
  },
  getCustomers: async (filter, options) => {
    const result= await Customer.paginate(filter, options);
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
    } },
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
