import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js"
const cafeLayoutSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    homeImage: { type: String, required: true },
    aboutImage: { type: String, required: true },

    menuTitle: { type: String, required: true },
    layoutTitle: { type: String, required: true },
    aboutTitle: { type: String, required: true },
    aboutDescription: { type: String, required: true },
    cafeDescription: { type: String, required: true },

    hours: {
      weekdays: { type: String, required: true },
      weekends: { type: String, required: true },
    },

    socialLinks: {
      instagram: String,
      facebook: String,
      twitter: String,
    },

    // 🟢 Only TRUE for superadmin layouts
    defaultLayout: {
      type: Boolean,
      default: false,
    },

    // 🟡 Only filled for admin layouts
    defaultLayoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CafeLayout",
      default: null,
    },
  },
  { timestamps: true  ,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
// 🔍 OPTION 2: Define the Virtual Relationship here
cafeLayoutSchema.virtual('menus', {
  ref: 'Menu',             // The name of your Menu model
  localField: 'adminId',   // Field in CafeLayout
  foreignField: 'adminId', // Field in Menu
});
cafeLayoutSchema.plugin(paginate)

export default mongoose.model("CafeLayout", cafeLayoutSchema);