import Customer from "../../../model/customer.js";
import Qr from "../../../model/qr.js";

const customerService = {
  createCustomer: async (body) => {

  const { name, phoneNumber, qrId } = body;

  if (!qrId) throw new Error("QR is required");

  const qr = await Qr.findById(qrId);

  if (!qr) throw new Error("Invalid QR");
  let customer = await Customer.findOne({
    adminId: qr.adminId,
    phoneNumber,
  });
  if (customer) {

    customer.name = name;
    customer.tableNumber = qr.tableNumber;
    customer.qrId = qrId;

    await customer.save();

    return customer;
  }
  const newCustomer = await Customer.create({
    name,
    phoneNumber,
    tableNumber: qr.tableNumber,
    adminId: qr.adminId,
    qrId,
  });
  return newCustomer.toObject();
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
