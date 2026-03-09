import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js";

const customerFeedbackSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rate: {
      type: Number,
      default: null,
      required: true
    },
    description: {
      type: String,
      default: "",
      required: true,
    },
    isPortfolioFeatured: {
      type: Boolean,
      default: false,
    },
    portfolioSelection: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);
customerFeedbackSchema.plugin(paginate);
customerFeedbackSchema.index({ adminId: 1, isPortfolioFeatured: 1, portfolioSelection: 1 });

export default mongoose.model("CustomerFeedback", customerFeedbackSchema);
