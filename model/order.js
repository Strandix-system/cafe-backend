import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
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
      default: 0,
    },

    orderStatus: {
      type: String,
      enum: ["pending", "accepted", "completed"],
      default: "pending",
    },

    paymentStatus: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);