import mongoose from "mongoose";
import { paginate } from "./plugin/paginate.plugin.js";

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: null,
      index: true,
    },
   
    razorpaySubscriptionId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "created",
        "authorized",
        "captured",
        "failed",
        "pending",
        "refunded",
      ],
      default: "created",
      index: true,
    },
    method: {
      type: String,
      default: null,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    invoiceId: {
      type: String,
      default: null,
      trim: true,
    },
    errorCode: {
      type: String,
      default: null,
      trim: true,
    },
    errorDescription: {
      type: String,
      default: null,
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    capturedAt: {
      type: Date,
      default: null,
    },
    razorpayCustomerId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    subscriptionPlanId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ["created", "active", "cancelled", "completed", "expired"],
      trim: true,
      default: "created",
      index: true,
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    source: {
      type: String,
      enum: ["signup", "renewal", "webhook", "system"],
      default: "signup",
    },
    raw: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);
transactionSchema.plugin(paginate)
export default mongoose.model("Transaction", transactionSchema);
