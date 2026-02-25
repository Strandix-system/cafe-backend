import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js"

const demoRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    cafeName: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["requested", "accepted", "rejected"],
      default: "requested",
    },
  },
  { timestamps: true }
);

demoRequestSchema.plugin(paginate)
export default mongoose.model("demoRequest",demoRequestSchema);
