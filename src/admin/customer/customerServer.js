import Customer from "../../../model/customer.js";

const customerService = {
  createCustomer: async (data) => {
    return await Customer.create(data);
  },

  getCustomers: async (filter, options) => {
    const result= await Customer.paginate(filter, options);
    return result;
  },
};

export default customerService;
