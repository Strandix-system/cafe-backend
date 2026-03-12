import express from "express";
import { orderController } from "../src/admin/order/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import { blockExpiredSubscription } from "../middleware/block.Expired.Subscription.js";
import { validate } from "../middleware/validate.js";
import {
  createOrderValidator,
  updatePaymentStatusValidator,
  updateOrderStatusValidator,
  orderIdParamValidator,
  orderBillIdParamValidator,
  getOrdersQueryValidator,
  getMyOrdersQueryValidator,
} from "../validations/order.validation.js";

export const orderRoute = express.Router();

orderRoute.post(
  "/public/create",
  validate(createOrderValidator),
  orderController.createPublicOrder
);

orderRoute.get(
  "/get-all",
  tokenVerification,
  allowRoles("admin"),
  blockExpiredSubscription,
  validate(getOrdersQueryValidator),
  orderController.getOrders
);

orderRoute.patch(
  "/status",
  tokenVerification,
  allowRoles("admin"),
  validate(updateOrderStatusValidator),
  orderController.updateStatus
);

orderRoute.get(
  "/items/:orderId",
  tokenVerification,
  allowRoles("admin"),
  validate(orderIdParamValidator),
  orderController.getItems
);

orderRoute.get(
  "/my-orders",
  validate(getMyOrdersQueryValidator),
  orderController.getMyOrders
);

orderRoute.patch(
  "/payment-status",
  tokenVerification,
  allowRoles("admin"),
  validate(updatePaymentStatusValidator),
  orderController.updatePaymentStatus
);
orderRoute.get(
  "/bill/:id",
  tokenVerification,
  allowRoles("admin","superadmin"),
  validate(orderBillIdParamValidator),
  orderController.getBillDetails
);


