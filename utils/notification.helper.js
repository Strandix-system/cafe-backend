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

/**
 * Validates that the provided value is a MongoDB ObjectId for the given field.
 */
const validateObjectId = (value, fieldName) => {
  if (!isValidObjectId(value)) {
    throw new ApiError(400, `Valid ${fieldName} is required`);
  }
};

/**
 * Returns the first value when an ObjectId is passed as an array.
 */
const getSingleObjectIdValue = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

/**
 * Sends a created notification to the correct socket recipient.
 */
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

/**
 * Builds the notification payload that will be stored in the database.
 */
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

  const adminId = recipient.adminId ?? payload.adminId;
  if (adminId != null) {
    notificationData.adminId = adminId;
  }

  if (payload.entityType) {
    notificationData.entityType = payload.entityType;
  }
  
  if (payload.entityId !== undefined && payload.entityId !== null) {
    notificationData.entityId = payload.entityId;
  }

  return notificationData;
};

/**
 * Creates a notification document and emits it in real time.
 */
const createNotificationDocument = async (payload, recipient) => {
  const notification = await Notification.create(
    buildNotificationData(payload, recipient)
  );

  emitNotification(notification);

  return notification;
};

/**
 * Confirms that the customer exists before customer notifications are accessed.
 */
const validateCustomerNotificationAccess = async (customerId) => {
  validateObjectId(customerId, "customerId");

  const customer = await Customer.findById(customerId).select("_id");

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }
};

/**
 * Resolves notification recipients based on the requested recipient type.
 */
const resolveRecipients = async (payload) => {
  switch (payload.recipientType) {
    case RECIPIENT_TYPES.ADMIN: {
      const targetUserId = getSingleObjectIdValue(
        payload.userId ?? payload.adminId
      );

      validateObjectId(targetUserId, "userId");

      const user = await User.findById(targetUserId).select("_id role");

      if (!user) {
        throw new ApiError(404, "Recipient admin not found");
      }

      return [
        {
          recipientType: RECIPIENT_TYPES.ADMIN,
          userId: user._id,
          adminId: payload?.adminId,
        },
      ];
    }

    case RECIPIENT_TYPES.CUSTOMER:
      validateObjectId(payload.customerId, "customerId");
      return [
        {
          recipientType: RECIPIENT_TYPES.CUSTOMER,
          customerId: payload.customerId,
          adminId: payload?.adminId,
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
        adminId: payload?.adminId,
      }));
    }

    default:
      throw new ApiError(400, "Invalid recipientType");
  }
};

/**
 * Applies optional notification filters to a base query object.
 */
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

/**
 * Builds the notification query filter for a user recipient.
 */
const getUserNotificationFilter = (userId, filter = {}) => {
  return applyNotificationFilter({ userId }, filter);
};

/**
 * Builds the notification query filter for a customer recipient.
 */
const getCustomerNotificationFilter = (customerId, filter = {}) => {
  return applyNotificationFilter({ customerId }, filter);
};

/**
 * Marks all notifications matching the query as read.
 */
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
  createNotificationDocument,
  validateCustomerNotificationAccess,
  resolveRecipients,
  getUserNotificationFilter,
  getCustomerNotificationFilter,
  markNotificationsAsRead,
};
