import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js";

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
    customers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
    ],
    tableNumber: {
      type: Number,
      required: true,
    },
    items: [
      {
        customerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer",
          required: true,
        },
        menuId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
          required: true,
        },

        name: String,

        price: Number,

        quantity: {
          type: Number,
          min: 1,
          required: true,
        },
      },
    ],
    specialInstruction: {
      type: String,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "preparing", "served", "completed"],
      default: "pending",
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
    gstPercent:{
      type: Number,
      required: true,
    },
  },

  { timestamps: true }
);


orderSchema.plugin(paginate);


export default mongoose.model("Order", orderSchema);
