import express from "express";
import { customerController } from "../src/admin/customer/customerController.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js"
export const customerRoute = express.Router();

customerRoute.post("/create", customerController.createCustomer);
customerRoute.get("/get-all",
    tokenVerification,
    allowRoles("admin", "superadmin"),
    customerController.getCustomers);
customerRoute.get("/:id", customerController.getCustomerById);
customerRoute.patch("/update/:id", customerController.updateCustomer);
customerRoute.delete("/delete/:id", customerController.deleteCustomer);

