import mongoose from "mongoose";
import cron from "node-cron";
import { notificationService } from "./src/notification/notification.service.js";

let notificationCleanupInitialized = false;

const runNotificationCleanup = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  return await notificationService.deleteOldNotifications();
};

const initNotificationCleanupScheduler = () => {
  if (notificationCleanupInitialized) {
    return;
  }

  notificationCleanupInitialized = true;

  const startCleanupScheduler = () => {
    cron.schedule("0 0 1 * *", runNotificationCleanup, {
      timezone: "Asia/Kolkata",
    });

    runNotificationCleanup();
  };

  if (mongoose.connection.readyState === 1) {
    startCleanupScheduler();
    return;
  }

  mongoose.connection.once("connected", startCleanupScheduler);
};

export const notificationCleanup = {
  runNotificationCleanup,
  initNotificationCleanupScheduler,
};
