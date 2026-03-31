import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js";
import { ORDER_STATUS } from "../utils/constants.js";

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    quantity: {
      type: Number,
      min: 1,
      required: true,
    },
    unitPrice: {
      type: Number,
      default: null,
    },
    specialInstruction: {   
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      trim: true,
    },
    servedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

orderItemSchema.plugin(paginate);

export const OrderItem = mongoose.model("OrderItem", orderItemSchema);
