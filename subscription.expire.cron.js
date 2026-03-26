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
const ADMIN_RECIPIENT_TYPE = "admin";
const SUBSCRIPTION_ENTITY_TYPE = "subscription";

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

const getSuperadminNotificationContent = (payload) => {
  const isExpired =
    payload.notificationType === NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED;

  return {
    title: isExpired
      ? "Admin subscription expired"
      : "Admin subscription expiring soon",
    message: isExpired
      ? `${payload.adminLabel}'s subscription expired.`
      : `${payload.adminLabel}'s subscription will expire in ${payload.diffDays} day(s).`,
  };
};

const buildSubscriptionNotificationQuery = ({
  title,
  message,
  notificationType,
  userId,
  adminId,
  entityId,
}) => ({
  title,
  message,
  notificationType,
  recipientType: ADMIN_RECIPIENT_TYPE,
  userId,
  adminId,
  entityType: SUBSCRIPTION_ENTITY_TYPE,
  entityId,
});

const buildSubscriptionNotificationPayload = ({
  title,
  message,
  notificationType,
  userId,
  adminId,
  entityId,
}) => ({
  title,
  message,
  notificationType,
  recipientType: ADMIN_RECIPIENT_TYPE,
  userId,
  adminId,
  entityType: SUBSCRIPTION_ENTITY_TYPE,
  entityId,
});

const getSubscriptionNotificationState = async (
  admin,
  payload,
  superadminIds,
  superadminContent
) => {
  const [adminNotificationExists, existingSuperadminNotifications] =
    await Promise.all([
      Notification.exists(
        buildSubscriptionNotificationQuery({
          title: payload.title,
          message: payload.message,
          notificationType: payload.notificationType,
          userId: admin._id,
          adminId: admin._id,
          entityId: payload.entityId,
        })
      ),
      superadminIds.length
        ? Notification.find({
          ...buildSubscriptionNotificationQuery({
            title: superadminContent.title,
            message: superadminContent.message,
            notificationType: payload.notificationType,
            adminId: admin._id,
            entityId: payload.entityId,
          }),
          userId: { $in: superadminIds },
        }).select("userId")
        : [],
    ]);

  return {
    adminNotificationExists,
    existingSuperadminUserIds: new Set(
      existingSuperadminNotifications.map((notification) =>
        notification.userId?.toString()
      )
    ),
  };
};

const createMissingSubscriptionNotifications = ({
  admin,
  payload,
  superadmins,
  superadminContent,
  adminNotificationExists,
  existingSuperadminUserIds,
}) => {
  const notificationPromises = [];

  if (!adminNotificationExists) {
    notificationPromises.push(
      notificationService.createNotification(
        buildSubscriptionNotificationPayload({
          title: payload.title,
          message: payload.message,
          notificationType: payload.notificationType,
          userId: admin._id,
          adminId: admin._id,
          entityId: payload.entityId,
        })
      )
    );
  }

  for (const superadmin of superadmins) {
    if (existingSuperadminUserIds.has(superadmin._id.toString())) {
      continue;
    }

    notificationPromises.push(
      notificationService.createNotification(
        buildSubscriptionNotificationPayload({
          title: superadminContent.title,
          message: superadminContent.message,
          notificationType: payload.notificationType,
          userId: superadmin._id,
          adminId: admin._id,
          entityId: payload.entityId,
        })
      )
    );
  }

  return notificationPromises;
};

export const createSubscriptionNotifications = async (admin, transaction) => {
  const payload = getNotificationPayload(admin, transaction);

  if (!payload) {
    return;
  }

  const superadminContent = getSuperadminNotificationContent(payload);
  const superadmins = await User.find({ role: "superadmin" }).select("_id");
  const superadminIds = superadmins.map((superadmin) => superadmin._id);

  const { adminNotificationExists, existingSuperadminUserIds } =
    await getSubscriptionNotificationState(
      admin,
      payload,
      superadminIds,
      superadminContent
    );

  const notificationPromises = createMissingSubscriptionNotifications({
    admin,
    payload,
    superadmins,
    superadminContent,
    adminNotificationExists,
    existingSuperadminUserIds,
  });

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
