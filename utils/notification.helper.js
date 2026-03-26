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

const buildNotificationData = (payload, recipient) => {
  const notificationData = {
    title: payload.title,
    message: payload.message,
    notificationType: payload.notificationType,
    recipientType: recipient.recipientType,
  };

  if (recipient.userId) {
    notificationData.userId = recipient.userId;
  }

  if (recipient.customerId) {
    notificationData.customerId = recipient.customerId;
  }

  if (recipient.adminId || payload.adminId) {
    notificationData.adminId = recipient.adminId || payload.adminId;
  }

  if (payload.entityType) {
    notificationData.entityType = payload.entityType;
  }
  
  if (payload.entityId !== undefined && payload.entityId !== null) {
    notificationData.entityId = payload.entityId;
  }

  return notificationData;
};

const createNotificationDocument = async (payload, recipient) => {
  const notification = await Notification.create(
    buildNotificationData(payload, recipient)
  );

  emitNotification(notification);

  return notification;
};

const validateCustomerNotificationAccess = async (customerId) => {
  validateObjectId(customerId, "customerId");

  const customer = await Customer.findById(customerId).select("_id");

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }
};

const resolveRecipients = async (payload) => {
  switch (payload.recipientType) {
    case RECIPIENT_TYPES.ADMIN: {
      validateObjectId(payload.userId, "userId");

      const user = await User.findById(payload.userId).select("_id role");

      if (!user) {
        throw new ApiError(404, "Recipient admin not found");
      }

      return [
        {
          recipientType: RECIPIENT_TYPES.ADMIN,
          userId: user._id,
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
        recipientType: RECIPIENT_TYPES.ADMIN,
        userId: user._id,
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

const getCustomerNotificationFilter = (customerId, filter = {}) => {
  return applyNotificationFilter({ customerId }, filter);
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
