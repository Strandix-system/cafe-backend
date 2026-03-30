import { notificationService } from "./notification.service.js";
import { pick } from "../../utils/pick.js";
import { sendSuccessResponse } from "../../utils/response.js";

export const notificationController = {
  getNotifications: async (req, res) => {
    const filter = pick(req.query, ["notificationType", "entityType", "isRead"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
    const data = await notificationService.getNotificationsForUser(
      req.user,
      filter,
      options
    );
    sendSuccessResponse(res, 200, "Notifications fetched", data);
  },

  markSingleRead: async (req, res) => {
    const data = await notificationService.markSingleRead(
      req.params.id,
      req.user
    );
    sendSuccessResponse(res, 200, "Notification marked as read", data);
  },

  deleteNotification: async (req, res) => {
    const data = await notificationService.deleteNotification(
      req.params.id,
      req.user
    );
    sendSuccessResponse(res, 200, "Notification deleted", data);
  },

  markAllRead: async (req, res) => {
    const filter = pick(req.body, ["entityType"]);
    const data = await notificationService.markAllReadForUser(req.user, filter);
    sendSuccessResponse(res, 200, "All notifications marked as read", data);
  },

  getCustomerNotifications: async (req, res) => {
    const filter = pick(req.query, ["notificationType", "entityType", "isRead"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
    const data = await notificationService.getCustomerNotifications(
      req.params.customerId,
      filter,
      options
    );
    sendSuccessResponse(res, 200, "Customer notifications fetched", data);
  },

  markAllCustomerRead: async (req, res) => {
    const filter = pick(req.body, ["entityType"]);
    const data = await notificationService.markAllReadForCustomer(
      req.body.customerId,
      filter
    );

    sendSuccessResponse(res, 200, "Customer notifications marked as read", data);
  },
};
