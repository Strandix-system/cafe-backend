import express from "express";
import orderController from "../src/admin/order/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";

const router = express.Router();

router.post(
  "/public/create",
  orderController.createPublicOrder
);

router.get(
  "/get-all",
  tokenVerification,
  allowRoles("admin"),
  orderController.getOrders
);

router.patch(
  "/status",
  tokenVerification,
  allowRoles("admin"),
  orderController.updateStatus
);

router.get(
  "/items/:id",
  tokenVerification,
  allowRoles("admin"),
  orderController.getItems
);

router.get(
  "/my-orders",
  orderController.getMyOrders
);


export default router;
