import Customer from "../../../model/customer.js";

const customerService = {
  createCustomer: async (data) => {
  const { name, phoneNumber, tableNumber, adminId } = data;

  if (!name || !phoneNumber || !tableNumber || !adminId) {
    throw new Error("All fields are required");
  }

  return await Customer.create({
    name,
    phoneNumber,
    tableNumber,
    adminId,
  });
},

  getCustomers: async (filter, options) => {
    const result= await Customer.paginate(filter, options);
    return result;
  },
};

export default customerService;
