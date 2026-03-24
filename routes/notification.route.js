import express from "express";
import { notificationController } from "../src/notification/notification.controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { allowRoles } from "../middleware/permission.js";
import { validate } from "../middleware/validate.js";
import {
  deleteNotificationValidator,
  getCustomerNotificationsValidator,
  getNotificationCountValidator,
  getNotificationsValidator,
  markAllCustomerNotificationsReadValidator,
  markAllReadValidator,
  markSingleReadValidator,
} from "../validations/notification.validation.js";

const router = express.Router();

router.get(
  "/all",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  validate(getNotificationsValidator),
  notificationController.getNotifications
);

router.patch(
  "/read/:id",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  validate(markSingleReadValidator),
  notificationController.markSingleRead
);

router.delete(
  "/delete/:id",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  validate(deleteNotificationValidator),
  notificationController.deleteNotification
);

router.patch(
  "/read-all",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  validate(markAllReadValidator),
  notificationController.markAllRead
);

router.get(
  "/count",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  validate(getNotificationCountValidator),
  notificationController.getUnreadCount
);

router.get(
  "/customer/:adminId/:customerId",
  (req, res, next) => tokenVerification(req, res, next, true),
  validate(getCustomerNotificationsValidator),
  notificationController.getCustomerNotifications
);

router.patch(
  "/customer/read-all",
  (req, res, next) => tokenVerification(req, res, next, true),
  validate(markAllCustomerNotificationsReadValidator),
  notificationController.markAllCustomerRead
);

export default router;
