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
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
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
    razorpayOrderId: {
      type: String,
      trim: true,
      default: null,
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
    email: {
      type: String,
      default: null,
      trim: true,
    },
    contact: {
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
