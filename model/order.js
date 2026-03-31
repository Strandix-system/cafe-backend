import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js";
import { GST_TYPES } from "../utils/constants.js";
import { ORDER_TYPES } from "../utils/constants.js";

const orderSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    orderType: {
      type: String,
      enum: Object.values(ORDER_TYPES),
      default: ORDER_TYPES.DINE_IN,
      required: true,
    },
    tableNumber: {
      type: Number,
      required: function () {
        return this.orderType === ORDER_TYPES.DINE_IN;
      },
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
    gstType: {
      type: String,
      enum: Object.values(GST_TYPES),
      default: GST_TYPES.EXCLUSIVE,
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
  },

  { timestamps: true },
);

orderSchema.plugin(paginate);

export default mongoose.model("Order", orderSchema);
