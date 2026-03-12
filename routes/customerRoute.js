import express from "express";
import { customerController } from "../src/admin/customer/customerController.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js"
import { validate } from "../middleware/validate.js";
import {
  createCustomerValidator,
  updateCustomerValidator,
  idParamValidator,
  getCustomersQueryValidator,
} from "../validations/customer.validation.js";
export const customerRoute = express.Router();

customerRoute.post(
  "/create",
  validate(createCustomerValidator),
  customerController.createCustomer
);
customerRoute.get("/get-all",
    tokenVerification,
    allowRoles("admin", "superadmin"),
    validate(getCustomersQueryValidator),
    customerController.getCustomers);
customerRoute.get(
  "/:id",
  validate(idParamValidator),
  customerController.getCustomerById
);
customerRoute.patch(
  "/update/:id",
  validate(updateCustomerValidator),
  customerController.updateCustomer
);
customerRoute.delete(
  "/delete/:id",
  validate(idParamValidator),
  customerController.deleteCustomer
);

