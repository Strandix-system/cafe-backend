import customerService from "./customerServer.js";
import { pick } from "../../../utils/pick.js";
import { verifyQrToken } from "../../../utils/qrToken.js";
import { ApiError } from "../../../utils/apiError.js";

const customerController = {
  createCustomer: async (req, res, next) => {
    try {
      const { name, phoneNumber, token } = req.body;

      let adminId = req.body.adminId;
      let tableNumber = req.body.tableNumber;

      if (token) {
        try {
          const decoded = verifyQrToken(token);
          adminId = decoded.adminId;
          tableNumber = decoded.tableNumber;
        } catch (error) {
          return next(new ApiError(400, "Invalid or expired QR token"));
        }
      }

      if (!adminId && req.user) {
        adminId = req.user._id;
      }

      if (!name || !phoneNumber || !tableNumber || !adminId) {
        return next(new ApiError(400, "All fields are required (name, phoneNumber, tableNumber/token)"));
      }

      const customer = await customerService.createCustomer({
        name,
        phoneNumber,
        tableNumber,
        adminId,
      });

      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
      });

    } catch (error) {
      next(error);
    }
  },
  getCustomers: async (req, res, next) => {
    try {
      const filter = pick(req.query, ["search"]);
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
