import express from "express";
import customerController from "../src/admin/customer/customerController.js";  

const router = express.Router();

router.post("/create", customerController.createCustomer);
router.get("/get-all", customerController.getCustomers);
router.get("/:id", customerController.getCustomerById);
router.patch("/update/:id", customerController.updateCustomer);
router.delete("/delete/:id", customerController.deleteCustomer);
export default router;
