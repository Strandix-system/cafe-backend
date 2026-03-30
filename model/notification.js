import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // what happened
    notificationType: {
      type: String,
      required: true,
      trim: true,
    },
    // Tells whether this notification belongs to an admin user or a customer.
    recipientType: {
      type: String,
      enum: ["admin", "customer"],
      required: true,
    },
    // Stores the recipient admin user when recipientType is "admin".
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required() {
        return this.recipientType === "admin";
      },
    },
    // Stores the recipient customer when recipientType is "customer".
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required() {
        return this.recipientType === "customer";
      },
    },
    // Tracks which admin created or triggered the notification.
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // where
    entityType: {
      type: String,
      trim: true,
      default: null,
    },
    // Saves the related record id for the entityType above.
    entityId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.plugin(paginate);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ customerId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ adminId: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
