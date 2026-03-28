import express from 'express';
import { notificationController } from '../src/notification/notification.controller.js';
import { tokenVerification } from '../middleware/auth.js';
import { allowRoles } from '../middleware/permission.js';
import { validate } from '../middleware/validate.js';
import {
  deleteNotificationValidator,
  getCustomerNotificationsValidator,
  getNotificationsValidator,
  markAllCustomerNotificationsReadValidator,
  markAllReadValidator,
  markSingleReadValidator,
} from '../validations/notification.validation.js';

const router = express.Router();

router.get(
  '/all',
  tokenVerification,
  allowRoles('admin', 'superadmin'),
  validate(getNotificationsValidator),
  notificationController.getNotifications,
);

router.patch(
  '/read/:id',
  tokenVerification,
  allowRoles('admin', 'superadmin'),
  validate(markSingleReadValidator),
  notificationController.markSingleRead,
);

router.delete(
  '/delete/:id',
  tokenVerification,
  allowRoles('admin', 'superadmin'),
  validate(deleteNotificationValidator),
  notificationController.deleteNotification,
);

router.patch(
  '/read-all',
  tokenVerification,
  allowRoles('admin', 'superadmin'),
  validate(markAllReadValidator),
  notificationController.markAllRead,
);

router.get(
  '/customer/:customerId',
  validate(getCustomerNotificationsValidator),
  notificationController.getCustomerNotifications,
);

router.patch(
  '/customer/read-all',
  validate(markAllCustomerNotificationsReadValidator),
  notificationController.markAllCustomerRead,
);

export default router;
