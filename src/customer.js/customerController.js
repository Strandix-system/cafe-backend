import customerService from "./customerServer.js";
import { pick } from "../../utils/pick.js";
const customerController = {
  createCustomer: async (req, res, next) => {
    try {
      const customer = await customerService.createCustomer(req.body);

      res.status(201).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  },

  getCustomers: async (req, res, next) => {
    try {
     const filter = pick(req.query,["search"]);
      const options = pick(req.query, ['page', 'limit', 'sortBy', 'populate']);

      const customers = await customerService.getCustomers(filter, options);

      res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default customerController;
