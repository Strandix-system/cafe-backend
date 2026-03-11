import express from "express";
import { orderController } from "../src/admin/order/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import { blockExpiredSubscription } from "../middleware/block.Expired.Subscription.js";

export const orderRoute = express.Router();

orderRoute.post(
  "/public/create",
  orderController.createPublicOrder
);

orderRoute.get(
  "/get-all",
  tokenVerification,
  allowRoles("admin"),
  blockExpiredSubscription,
  orderController.getOrders
);

orderRoute.patch(
  "/status",
  tokenVerification,
  allowRoles("admin"),
  orderController.updateStatus
);

orderRoute.get(
  "/items/:orderId",
  tokenVerification,
  allowRoles("admin"),
  orderController.getItems
);

orderRoute.get(
  "/my-orders",
  orderController.getMyOrders
);

orderRoute.patch(
  "/payment-status",
  tokenVerification,
  allowRoles("admin"),
  orderController.updatePaymentStatus
);
orderRoute.get(
  "/bill/:id",
  tokenVerification,
  allowRoles("admin","superadmin"),
  orderController.getBillDetails
);


