import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js"
import indiaStates from "../config/indiaStates.js";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
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
      trim: true,
      unique: true
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
    profileImage: {
      type: String,
      trim: true,
      required: false,
      default: null
    },
    logo: {
      type: String,
      default: null, required: false
    },
    gst:{
     type: Number,
     required: true,
     default:5,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
      required: true
    },
    gst: {
      type: Number, // percentage
      default: 5,
      required: true
    },
  },
  { timestamps: true }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});
userSchema.plugin(paginate)
export default mongoose.model("User", userSchema);
