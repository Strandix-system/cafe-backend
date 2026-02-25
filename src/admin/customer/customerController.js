import customerService from "./customerServer.js";
import { pick } from "../../../utils/pick.js";
import { sendSuccessResponse } from "../../../utils/response.js";

const customerController = {
  createCustomer: async (req, res, next) => {
    try {

      const customer =
        await customerService.createCustomer(req.body);
      sendSuccessResponse(res, 201, "Customer created", customer);
    } catch (err) {
      next(err);
    }
  },
getCustomers: async (req, res, next) => {
  try {
    const filter = pick(req.query, ["search", "adminId"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);

    const customers = await customerService.getCustomers(
      filter,
      options,
      req.user
    );

    sendSuccessResponse(res, 200, "Customers fetched", customers);
  } catch (error) {
    next(error);
  }
},
  getCustomerById: async (req, res, next) => {

    try {
      const customer = await customerService.getCustomerById(req.params.id);
      sendSuccessResponse(res, 200, "Customer fetched", customer);
    } catch (error) {
      next(error);
    }
  },
  updateCustomer: async (req, res, next) => {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body);
      sendSuccessResponse(res, 200, "Customer updated", customer);
    } catch (error) {
      next(error);
    }
  },
  deleteCustomer: async (req, res, next) => {
    try {
      const result = await customerService.deleteCustomer(req.params.id);
      sendSuccessResponse(res, 200, "Customer deleted", result);
    } catch (error) {
      next(error);
    }
  },
};

export default customerController;