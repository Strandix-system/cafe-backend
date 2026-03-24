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

  markAllRead: async (req, res) => {
    const filter = pick(req.body, ["entityType"]);
    const data = await notificationService.markAllReadForUser(req.user, filter);
    sendSuccessResponse(res, 200, "All notifications marked as read", data);
  },

  getUnreadCount: async (req, res) => {
    const filter = pick(req.query, ["entityType"]);
    const unreadCount = await notificationService.getUnreadCountForUser(
      req.user,
      filter
    );
    sendSuccessResponse(res, 200, "Notification count fetched", { unreadCount });
  },

  getCustomerNotifications: async (req, res) => {
    const filter = pick(req.query, ["notificationType", "entityType", "isRead"]);
    const options = pick(req.query, ["page", "limit", "sortBy", "populate"]);
    const data = await notificationService.getCustomerNotifications(
      req.params.customerId,
      req.params.adminId,
      filter,
      options
    );
    sendSuccessResponse(res, 200, "Customer notifications fetched", data);
  },

  markAllCustomerRead: async (req, res) => {
    const filter = pick(req.body, ["entityType"]);
    const data = await notificationService.markAllReadForCustomer(
      req.body.customerId,
      req.body.adminId,
      filter
    );

    sendSuccessResponse(
      res,
      200,
      "Customer notifications marked as read",
      data
    );
  },
};
