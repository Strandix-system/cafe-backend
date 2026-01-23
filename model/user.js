import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js"
import indiaStates from "../config/indiaStates.js";
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    cafeName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phoneNumber: {
      type: Number,
      trim: true
    },
    password: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true,
      enum: indiaStates
    },
    city: {
      type: String,
      trim: true
    },
    pincode: {
      type: Number,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin", required: true
    },

  },
  { timestamps: true }
);
userSchema.plugin(paginate)
export default mongoose.model("User", userSchema);
