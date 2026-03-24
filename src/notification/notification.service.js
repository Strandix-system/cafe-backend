import { Notification } from "../../model/notification.js";
import { ApiError } from "../../utils/apiError.js";
import { createNotificationPayloadValidator } from "../../validations/notification.validation.js";
import {
  createNotificationDocument,
  getCustomerNotificationFilter,
  getUserNotificationFilter,
  markNotificationsAsRead,
  resolveRecipients,
  validateCustomerNotificationAccess,
} from "../../utils/notification.helper.js";

export const notificationService = {
  createNotification: async (payload) => {
    const { error } = createNotificationPayloadValidator.validate(payload);

    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const recipients = await resolveRecipients(payload);
    return await Promise.all(
      recipients.map((recipient) =>
        createNotificationDocument(payload, recipient)
      )
    );
  },

  getNotificationsForUser: async (user, filter = {}, options = {}) => {
    const query = getUserNotificationFilter(user._id, filter);
    const finalOptions = { ...options };

    if (!finalOptions.populate) {
      finalOptions.populate = "adminId,customerId";
    }

    return await Notification.paginate(query, finalOptions);
  },

  markSingleRead: async (notificationId, user) => {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId: user._id,
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  },

  markAllReadForUser: async (user, filter = {}) => {
    const query = getUserNotificationFilter(user._id, filter);
    query.isRead = false;
    return await markNotificationsAsRead(query);
  },

  getUnreadCountForUser: async (user, filter = {}) => {
    const query = getUserNotificationFilter(user._id, filter);
    query.isRead = false;

    return await Notification.countDocuments(query);
  },

  getCustomerNotifications: async (customerId, adminId, filter = {}, options = {}) => {
    await validateCustomerNotificationAccess(customerId, adminId);
    const query = getCustomerNotificationFilter(customerId, adminId, filter);
    const finalOptions = { ...options };

    if (!finalOptions.populate) {
      finalOptions.populate = "adminId";
    }

    return await Notification.paginate(query, finalOptions);
  },

  markAllReadForCustomer: async (customerId, adminId, filter = {}) => {
    await validateCustomerNotificationAccess(customerId, adminId);
    const query = getCustomerNotificationFilter(customerId, adminId, filter);
    query.isRead = false;
    return await markNotificationsAsRead(query);
  },
};
