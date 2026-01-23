import mongoose from "mongoose";
import {paginate} from "../model/plugin/paginate.plugin.js"
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
    password: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",required: true
    },
  
  },
  { timestamps: true }
);
userSchema.plugin(paginate)
export default mongoose.model("User", userSchema);
