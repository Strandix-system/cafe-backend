import { isValidObjectId } from "mongoose";
import { Notification } from "../model/notification.js";
import User from "../model/user.js";
import Customer from "../model/customer.js";
import { ApiError } from "./apiError.js";
import { RECIPIENT_TYPES } from "./constants.js";
import {
  emitNotificationToCustomer,
  emitNotificationToUser,
} from "../socket.js";

const validateObjectId = (value, fieldName) => {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Valid ${fieldName} is required`);
  }
};

const emitNotification = (notificationDoc) => {
  const notification = notificationDoc?.toObject
    ? notificationDoc.toObject()
    : notificationDoc;

  try {
    if (
      notification?.recipientType === RECIPIENT_TYPES.CUSTOMER &&
      notification?.customerId
    ) {
      emitNotificationToCustomer(notification.customerId, notification);
      return;
    }

    if (notification?.userId) {
      emitNotificationToUser(notification.userId, notification);
    }
  } catch (error) {
    console.error("Notification socket error:", error.message);
  }
};

const buildNotificationData = (payload, recipient) => ({
  title: payload.title,
  message: payload.message,
  notificationType: payload.notificationType,
  recipientType: recipient.recipientType,
  recipientRole: recipient.recipientRole || null,
  userId: recipient.userId || null,
  customerId: recipient.customerId || null,
  adminId: recipient.adminId || payload.adminId || null,
  entityType: payload.entityType || null,
  entityId: payload.entityId ?? null,
});

const createNotificationDocument = async (payload, recipient) => {
  const notification = await Notification.create(
    buildNotificationData(payload, recipient)
  );

  emitNotification(notification);

  return notification;
};

const validateCustomerNotificationAccess = async (customerId, adminId) => {
  validateObjectId(customerId, "customerId");
  validateObjectId(adminId, "adminId");

  const customer = await Customer.findOne({
    _id: customerId,
    adminId,
  }).select("_id");

  if (!customer) {
    throw new ApiError(404, "Customer not found for this admin");
  }
};

const resolveRecipients = async (payload) => {
  switch (payload.recipientType) {
    case RECIPIENT_TYPES.USER: {
      validateObjectId(payload.userId, "userId");

      const user = await User.findById(payload.userId).select("_id role");

      if (!user) {
        throw new ApiError(404, "Recipient user not found");
      }

      return [
        {
          recipientType: RECIPIENT_TYPES.USER,
          userId: user._id,
          recipientRole: user.role,
          adminId: payload.adminId || null,
        },
      ];
    }

    case RECIPIENT_TYPES.CUSTOMER:
      validateObjectId(payload.customerId, "customerId");

      return [
        {
          recipientType: RECIPIENT_TYPES.CUSTOMER,
          customerId: payload.customerId,
          adminId: payload.adminId || null,
        },
      ];

    case RECIPIENT_TYPES.ROLE: {
      if (
        !payload.recipientRole ||
        !["admin", "superadmin"].includes(payload.recipientRole)
      ) {
        throw new ApiError(
          400,
          "Valid recipientRole is required for role notifications"
        );
      }

      const users = await User.find({ role: payload.recipientRole }).select(
        "_id role"
      );

      return users.map((user) => ({
        recipientType: RECIPIENT_TYPES.USER,
        userId: user._id,
        recipientRole: user.role,
        adminId: payload.adminId || null,
      }));
    }

    default:
      throw new ApiError(400, "Invalid recipientType");
  }
};

const applyNotificationFilter = (query, filter = {}) => {
  const finalQuery = { ...query };

  if (filter.notificationType) {
    finalQuery.notificationType = filter.notificationType;
  }

  if (filter.entityType) {
    finalQuery.entityType = filter.entityType;
  }

  if (typeof filter.isRead === "boolean") {
    finalQuery.isRead = filter.isRead;
  }

  return finalQuery;
};

const getUserNotificationFilter = (userId, filter = {}) => {
  return applyNotificationFilter({ userId }, filter);
};

const getCustomerNotificationFilter = (customerId, adminId, filter = {}) => {
  const query = { customerId };

  if (adminId) {
    query.adminId = adminId;
  }

  return applyNotificationFilter(query, filter);
};

const markNotificationsAsRead = async (query) => {
  const result = await Notification.updateMany(query, {
    $set: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return {
    modifiedCount: result.modifiedCount || 0,
  };
};

export {
  validateObjectId,
  emitNotification,
  buildNotificationData,
  applyNotificationFilter,
  createNotificationDocument,
  validateCustomerNotificationAccess,
  resolveRecipients,
  getUserNotificationFilter,
  getCustomerNotificationFilter,
  markNotificationsAsRead,
};
