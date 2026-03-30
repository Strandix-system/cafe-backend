import express from 'express';

import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import { validate } from '../middleware/validate.js';
import { orderController } from '../src/admin/order/controller.js';
import { orderItemController } from '../src/admin/orderItem/orderItem.controller.js';
import {
  createOrderSchema,
  createOfflineOrderSchema,
  getActiveOrderSchema,
  getOrdersSchema,
  updateIsCompletedSchema,
  getMyOrdersSchema,
  updatePaymentStatusSchema,
  getBillSchema,
  deleteOrderSchema,
  changeTableSchema,
  changeTablePublicSchema,
} from '../validations/order.Validation.js';
import {
  updateItemStatusSchema,
  deleteItemSchema,
  updateQuantitySchema,
  getItemsSchema,
} from '../validations/orderItem.Validation.js';
const router = express.Router();

router.post(
  '/public/create',
  validate(createOrderSchema),
  orderController.createPublicOrder,
);

router.post(
  '/offline/create',
  tokenVerification,
  allowRoles('admin'),
  validate(createOfflineOrderSchema),
  orderController.createOfflineOrder,
);

router.get(
  '/active/:qrId',
  validate(getActiveOrderSchema),
  orderController.getActiveOrderByQr,
);

router.get(
  '/get-all',
  validate(getOrdersSchema),
  tokenVerification,
  allowRoles('admin'),
  orderController.getOrders,
);

router.patch(
  '/status',
  validate(updateIsCompletedSchema),
  tokenVerification,
  allowRoles('admin'),
  orderController.updateIsCompletedStatus,
);

router.get(
  '/items/:orderId',
  tokenVerification,
  allowRoles('admin'),
  validate(getItemsSchema),
  orderItemController.getItems,
);

router.patch(
  '/item-status',
  tokenVerification,
  allowRoles('admin'),
  validate(updateItemStatusSchema),
  orderItemController.updateItemStatus,
);

router.patch(
  '/item-quantity',
  tokenVerification,
  allowRoles('admin'),
  validate(updateQuantitySchema),
  orderItemController.updateQuantity,
);

router.patch(
  '/public/item-quantity',
  validate(updateQuantitySchema),
  orderItemController.updateQuantity,
);

router.delete(
  '/item/:orderItemId',
  tokenVerification,
  allowRoles('admin'),
  validate(deleteItemSchema),
  orderItemController.deleteItem,
);

router.delete(
  '/public/item/:orderItemId',
  validate(deleteItemSchema),
  orderItemController.deleteItem,
);

router.get(
  '/my-orders',
  validate(getMyOrdersSchema),
  orderController.getMyOrders,
);

router.patch(
  '/payment-status',
  tokenVerification,
  allowRoles('admin'),
  validate(updatePaymentStatusSchema),
  orderController.updatePaymentStatus,
);

router.patch(
  '/change-table',
  tokenVerification,
  allowRoles('admin', 'customer'),
  validate(changeTableSchema),
  orderController.changeTable,
);

router.patch(
  '/public/change-table',
  validate(changeTablePublicSchema),
  orderController.changeTablePublic,
);

router.get(
  '/bill/:id',
  tokenVerification,
  allowRoles('admin', 'superadmin'),
  validate(getBillSchema),
  orderController.getBillDetails,
);

router.delete(
  '/:orderId',
  tokenVerification,
  allowRoles('admin'),
  validate(deleteOrderSchema),
  orderController.deleteOrder,
);

router.get(
  '/admin/:orderId',
  tokenVerification,
  allowRoles('admin'),
  orderController.getOrderById,
);

export default router;
