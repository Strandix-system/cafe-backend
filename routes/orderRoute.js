import express from "express";
import orderController from "../src/admin/order/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";

const router = express.Router();

// Create order (Customer / Admin)
router.post(
  "/create",
  tokenVerification,
  allowRoles("admin", "customer"),
  orderController.createOrder
);

// Admin orders
router.get(
  "/",
  tokenVerification,
  allowRoles("admin"),
  orderController.getOrders
);

// Update status
router.put(
  "/status/:id",
  tokenVerification,
  allowRoles("admin"),
  orderController.updateStatus
);

// Get order items
router.get(
  "/items/:id",
  tokenVerification,
  allowRoles("admin"),
  orderController.getItems
);

export default router;