import express from "express";
import orderController from "../src/admin/order/controller.js";
import orderItemController from "../src/admin/orderItem/orderItem.controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";

const router = express.Router();

router.post(
  "/public/create",
  orderController.createPublicOrder
);

router.get(
  "/active/:qrId",
  orderController.getActiveOrderByQr
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
  orderController.updateIsCompletedStatus
);

router.get(
  "/items/:orderId",
  tokenVerification,
  allowRoles("admin"),
  orderItemController.getItems
);

router.patch(
  "/item-status",
  tokenVerification,
  allowRoles("admin"),
  orderItemController.updateItemStatus
);

router.patch(
  "/item-quantity",
  tokenVerification,
  allowRoles("admin"),
  orderItemController.updateQuantity
);

router.patch(
  "/public/item-quantity",
  orderItemController.updateQuantity
);

router.get(
  "/my-orders",
  orderController.getMyOrders
);

router.patch(
  "/payment-status",
  tokenVerification,
  allowRoles("admin"),
  orderController.updatePaymentStatus
);
router.get(
  "/bill/:id",
  tokenVerification,
  allowRoles("admin","superadmin"),
  orderController.getBillDetails
);


export default router;
