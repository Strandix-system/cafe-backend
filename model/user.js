import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js"
import indiaStates from "../config/indiaStates.js";
import bcrypt from "bcryptjs";
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    cafeName: {
      type: String,
      required: true,
      trim: true,
      default: "Your Cafe Name"
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
      trim: true,
      select: false // 🔥 Important: Don't return password by default 
    },
    address: {
      type: String,
      trim: true,
      default: "your address"
    },
    state: {
      type: String,
      trim: true,
      enum: indiaStates,
      default: "Madhya Pradesh"
    },
    city: {
      type: String,
      trim: true,
      default: "Indore"
    },
    pincode: {
      type: Number,
      trim: true,
      default: null
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
    gst: {
      type: Number,
      required: true,
      default: 5,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
      required: true
    },
    hours: {
      weekdays: { type: String, required: true, default: "10:00 AM-10:00 PM" },
      weekends: { type: String, required: true, default: "10:00 AM-11:00 PM" },
    },
    socialLinks: {
      instagram: { type: String, default: null },
      facebook: { type: String, default: null },
      twitter: { type: String, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false
  }
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
