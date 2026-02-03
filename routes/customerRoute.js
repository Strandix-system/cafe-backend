import express from "express";
import customerController from "../src/customer.js/customerController.js";

const router = express.Router();

router.post("/create", customerController.createCustomer);
router.get("/", customerController.getCustomers);

export default router;
