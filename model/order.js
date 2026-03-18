import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js";

const orderSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    specialInstruction: {
      type: String,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: Boolean,
      default: false,
    },
    gstAmount: {
      type: Number,
      required: true,
    },
    subTotal: {
      type: Number,
      required: true,
    },
    gstPercent: {
      type: Number,
      required: true,
    },
  },

  { timestamps: true }
);

orderSchema.plugin(paginate);

export default mongoose.model("Order", orderSchema);
