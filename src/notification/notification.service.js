import { Notification } from "../../model/notification.js";
import { ApiError } from "../../utils/apiError.js";
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

    const unreadCountFilter = {
      notificationType: filter.notificationType,
      entityType: filter.entityType,
    };
    const unreadCountQuery = getUserNotificationFilter(
      user._id,
      unreadCountFilter
    );
    unreadCountQuery.isRead = false;

    const [paginatedNotifications, unreadCount] = await Promise.all([
      Notification.paginate(query, finalOptions),
      Notification.countDocuments(unreadCountQuery),
    ]);

    return {
      ...paginatedNotifications,
      count: paginatedNotifications.totalResults,
      unreadCount,
    };
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

  deleteNotification: async (notificationId, user) => {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: user._id,
    });

    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }

    return notification;
  },

  deleteOldNotifications: async () => {
    const startOfPreviousMonth = new Date();
    startOfPreviousMonth.setDate(1);
    startOfPreviousMonth.setHours(0, 0, 0, 0);
    startOfPreviousMonth.setMonth(startOfPreviousMonth.getMonth() - 1);

    const result = await Notification.deleteMany({
      createdAt: { $lt: startOfPreviousMonth },
    });

    return {
      deletedCount: result.deletedCount || 0,
    };
  },

  markAllReadForUser: async (user, filter = {}) => {
    const query = getUserNotificationFilter(user._id, filter);
    query.isRead = false;
    return await markNotificationsAsRead(query);
  },

  getCustomerNotifications: async (customerId, filter = {}, options = {}) => {
    await validateCustomerNotificationAccess(customerId);
    const query = getCustomerNotificationFilter(customerId, filter);
    const finalOptions = { ...options };

    if (!finalOptions.populate) {
      finalOptions.populate = "adminId";
    }

    const unreadCountFilter = {
      notificationType: filter.notificationType,
      entityType: filter.entityType,
    };
    const unreadCountQuery = getCustomerNotificationFilter(
      customerId,
      unreadCountFilter
    );
    unreadCountQuery.isRead = false;

    const [paginatedNotifications, unreadCount] = await Promise.all([
      Notification.paginate(query, finalOptions),
      Notification.countDocuments(unreadCountQuery),
    ]);

    return {
      ...paginatedNotifications,
      count: paginatedNotifications.totalResults,
      unreadCount,
    };
  },

  markAllReadForCustomer: async (customerId, filter = {}) => {
    await validateCustomerNotificationAccess(customerId);
    const query = getCustomerNotificationFilter(customerId, filter);
    query.isRead = false;
    return await markNotificationsAsRead(query);
  },
};
