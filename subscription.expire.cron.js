import mongoose from "mongoose";
import cron from "node-cron";
import User from "./model/user.js";
import { Notification } from "./model/notification.js";
import { Transaction } from "./model/transaction.js";
import { notificationService } from "./src/notification/notification.service.js";
import { NOTIFICATION_TYPES } from "./utils/constants.js";

let schedulerInitialized = false;
let isRunning = false;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getAdminLabel = (admin) =>
  admin.cafeName ||
  `${admin.firstName || ""} ${admin.lastName || ""}`.trim() ||
  "Admin";

const getDiffDays = (endDate) =>
  Math.ceil((new Date(endDate).getTime() - Date.now()) / DAY_IN_MS);

const getLatestTransaction = async (adminId) =>
  await Transaction.findOne({
    user: adminId,
    subscriptionEndDate: { $ne: null },
  })
    .sort({ subscriptionEndDate: -1 })
    .select("_id subscriptionEndDate subscriptionStatus");

const getNotificationPayload = (admin, transaction) => {
  const endDate = new Date(transaction.subscriptionEndDate);
  const diffDays = getDiffDays(endDate);

  if (diffDays > 7) {
    return null;
  }

  const isExpired = diffDays <= 0;
  const adminLabel = getAdminLabel(admin);
  const formattedDate = endDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const notificationType = isExpired
    ? NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED
    : NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING_SOON;
  const title = isExpired ? "Subscription expired" : "Subscription expiring soon";
  const message = isExpired
    ? `Your subscription expired on ${formattedDate}. Please renew to continue using the service.`
    : `Your subscription will expire in ${diffDays} day(s) on ${formattedDate}.`;

  return {
    notificationType,
    title,
    message,
    adminLabel,
    diffDays,
    entityId: transaction._id,
  };
};

export const createSubscriptionNotifications = async (admin, transaction) => {
  const payload = getNotificationPayload(admin, transaction);

  if (!payload) {
    return;
  }

  const superadminTitle =
    payload.notificationType === NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED
      ? "Admin subscription expired"
      : "Admin subscription expiring soon";
  const superadminMessage =
    payload.notificationType === NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED
      ? `${payload.adminLabel}'s subscription expired.`
      : `${payload.adminLabel}'s subscription will expire in ${payload.diffDays} day(s).`;

  const [adminNotificationExists, superadmins, existingSuperadminNotifications] = await Promise.all([
    Notification.exists({
      title: payload.title,
      message: payload.message,
      notificationType: payload.notificationType,
      recipientType: "user",
      userId: admin._id,
      adminId: admin._id,
      entityType: "subscription",
      entityId: payload.entityId,
    }),
    User.find({ role: "superadmin" }).select("_id"),
    Notification.find({
      title: superadminTitle,
      message: superadminMessage,
      notificationType: payload.notificationType,
      recipientType: "user",
      recipientRole: "superadmin",
      adminId: admin._id,
      entityType: "subscription",
      entityId: payload.entityId,
    }).select("userId"),
  ]);

  const notificationPromises = [];

  if (!adminNotificationExists) {
    notificationPromises.push(
      notificationService.createNotification({
        title: payload.title,
        message: payload.message,
        notificationType: payload.notificationType,
        recipientType: "user",
        userId: admin._id,
        adminId: admin._id,
        entityType: "subscription",
        entityId: payload.entityId,
      })
    );
  }

  const existingSuperadminUserIds = new Set(
    existingSuperadminNotifications.map((notification) =>
      notification.userId?.toString()
    )
  );

  for (const superadmin of superadmins) {
    if (existingSuperadminUserIds.has(superadmin._id.toString())) {
      continue;
    }

    notificationPromises.push(
      notificationService.createNotification({
        title:
          superadminTitle,
        message: superadminMessage,
        notificationType: payload.notificationType,
        recipientType: "user",
        userId: superadmin._id,
        adminId: admin._id,
        entityType: "subscription",
        entityId: payload.entityId,
      })
    );
  }

  await Promise.all(notificationPromises);
};

const runSubscriptionNotificationScan = async () => {
  if (isRunning || mongoose.connection.readyState !== 1) {
    return;
  }

  isRunning = true;

  try {
    const admins = await User.find({ role: "admin" }).select(
      "_id firstName lastName cafeName"
    );

    for (const admin of admins) {
      const latestTransaction = await getLatestTransaction(admin._id);

      if (!latestTransaction?.subscriptionEndDate) {
        continue;
      }

      await createSubscriptionNotifications(admin, latestTransaction);
    }
  } catch (error) {
    console.error("Subscription notification scan failed:", error.message);
  } finally {
    isRunning = false;
  }
};

const initSubscriptionNotificationScheduler = () => {
  if (schedulerInitialized) {
    return;
  }

  schedulerInitialized = true;

  const startScheduler = () => {
    cron.schedule("0 * * * *", runSubscriptionNotificationScan, {
      timezone: "Asia/Kolkata",
    });

    runSubscriptionNotificationScan();
  };

  if (mongoose.connection.readyState === 1) {
    startScheduler();
    return;
  }

  mongoose.connection.once("connected", startScheduler);
};

export const subscriptionNotifier = {
  createSubscriptionNotifications,
  runSubscriptionNotificationScan,
  initSubscriptionNotificationScheduler,
};
