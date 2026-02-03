import mongoose from "mongoose";
import cafeItemCategories from "../config/category.js"
import { allowRoles } from "../middleware/permission.js";

const cafeLayoutSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // Admin can override template images/content for their cafe
    homeImage: { type: String, required: true, trim: true },
    aboutImage: { type: String, required: true, trim: true },
    menuTitle: { type: String, required: true, trim: true },
    categories: {
      type: [String],          // ✅ array of strings
      enum: cafeItemCategories, // ✅ allowed values
      required: true,
    },
    aboutTitle: { type: String, required: true, trim: true },
    aboutDescription: { type: String, required: true, trim: true },
    cafeDescription: { type: String, required: true, trim: true },
    defaultLayout: {
      type: Boolean,
      default: false,
      required: function () {
        return this.role === "superadmin";
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("CafeLayout", cafeLayoutSchema);
