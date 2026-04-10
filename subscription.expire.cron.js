import mongoose from 'mongoose';
import cron from 'node-cron';

import { Notification } from './model/notification.js';
import { Transaction } from './model/transaction.js';
import User from './model/user.js';
import { notificationService } from './src/notification/notification.service.js';
import {
  ENTITY_TYPES,
  NOTIFICATION_TYPES,
  RECIPIENT_TYPES,
} from './utils/constants.js';

let schedulerInitialized = false;
let isRunning = false;

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ADMIN_RECIPIENT_TYPE = RECIPIENT_TYPES.ADMIN;
const SUBSCRIPTION_ENTITY_TYPE = ENTITY_TYPES.SUBSCRIPTION;

/**
 * Returns a readable label for an admin used in notification messages.
 */
const getAdminLabel = (admin) =>
  admin.cafeName ||
  `${admin.firstName || ''} ${admin.lastName || ''}`.trim() ||
  'Admin';

/**
 * Calculates how many whole days remain until the subscription end date.
 */
const getDiffDays = (endDate) =>
  Math.ceil((new Date(endDate).getTime() - Date.now()) / DAY_IN_MS);

/**
 * Fetches the latest transaction that contains subscription details for an admin.
 */
const getLatestTransaction = async (adminId) =>
  await Transaction.findOne({
    user: adminId,
    subscriptionEndDate: { $ne: null },
  })
    .sort({ subscriptionEndDate: -1 })
    .select('_id subscriptionEndDate subscriptionStatus');

/**
 * Builds the base subscription notification content for the admin.
 */
const getNotificationPayload = (admin, transaction) => {
  const endDate = new Date(transaction.subscriptionEndDate);
  const diffDays = getDiffDays(endDate);

  if (diffDays > 7) {
    return;
  }

  const isExpired = diffDays <= 0;
  const adminLabel = getAdminLabel(admin);
  const formattedDate = endDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const notificationType = isExpired
    ? NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED
    : NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING_SOON;
  const title = isExpired
    ? 'Subscription expired'
    : 'Subscription expiring soon';
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

/**
 * Creates the notification title and message that superadmins should receive.
 */
const getSuperadminNotificationContent = (payload) => {
  const isExpired =
    payload.notificationType === NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRED;

  return {
    title: isExpired
      ? 'Admin subscription expired'
      : 'Admin subscription expiring soon',
    message: isExpired
      ? `${payload.adminLabel}'s subscription expired.`
      : `${payload.adminLabel}'s subscription will expire in ${payload.diffDays} day(s).`,
  };
};

/**
 * Builds the query used to check whether a subscription notification already exists.
 */
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

/**
 * Builds the payload used to create a subscription notification.
 */
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

/**
 * Checks which subscription notifications already exist for the admin and superadmins.
 */
const getSubscriptionNotificationState = async (
  admin,
  payload,
  superadminIds,
  superadminContent,
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
        }),
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
          }).select('userId')
        : [],
    ]);

  return {
    adminNotificationExists,
    existingSuperadminUserIds: new Set(
      existingSuperadminNotifications.map((notification) =>
        notification.userId?.toString(),
      ),
    ),
  };
};

/**
 * Creates notification tasks only for recipients who have not been notified yet.
 */
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
        }),
      ),
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
        }),
      ),
    );
  }

  return notificationPromises;
};

/**
 * Creates subscription expiry notifications for the admin and all superadmins.
 */
export const createSubscriptionNotifications = async (admin, transaction) => {
  const payload = getNotificationPayload(admin, transaction);

  if (!payload) {
    return;
  }

  const superadminContent = getSuperadminNotificationContent(payload);
  const superadmins = await User.find({ role: 'superadmin' }).select('_id');
  const superadminIds = superadmins.map((superadmin) => superadmin._id);

  const { adminNotificationExists, existingSuperadminUserIds } =
    await getSubscriptionNotificationState(
      admin,
      payload,
      superadminIds,
      superadminContent,
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

/**
 * Scans admin subscriptions and triggers notifications for expiring or expired ones.
 */
const runSubscriptionNotificationScan = async () => {
  if (isRunning || mongoose.connection.readyState !== 1) {
    return;
  }

  isRunning = true;

  try {
    const admins = await User.find({ role: 'admin' }).select(
      '_id firstName lastName cafeName',
    );

    for (const admin of admins) {
      const latestTransaction = await getLatestTransaction(admin._id);

      if (!latestTransaction?.subscriptionEndDate) {
        continue;
      }

      await createSubscriptionNotifications(admin, latestTransaction);
    }
  } catch (error) {
    console.error('Subscription notification scan failed:', error.message);
  } finally {
    isRunning = false;
  }
};

/**
 * Starts the cron scheduler once and runs an initial subscription scan.
 */
const initSubscriptionNotificationScheduler = () => {
  if (schedulerInitialized) {
    return;
  }

  schedulerInitialized = true;

  /**
   * Registers the hourly cron job and triggers the first scan immediately.
   */
  const startScheduler = () => {
    cron.schedule('0 * * * *', runSubscriptionNotificationScan, {
      timezone: 'Asia/Kolkata',
    });

    runSubscriptionNotificationScan();
  };

  if (mongoose.connection.readyState === 1) {
    startScheduler();
    return;
  }

  mongoose.connection.once('connected', startScheduler);
};

export const subscriptionNotifier = {
  createSubscriptionNotifications,
  runSubscriptionNotificationScan,
  initSubscriptionNotificationScheduler,
};
