import mongoose from "mongoose";

const cafeLayoutSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  layoutTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LayoutTemplate",
    required: true
  },
  cafeTitle: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  images: [
    {
      type: String,
      required: true
    }
  ]
}, { timestamps: true });

export default mongoose.model("CafeLayout", cafeLayoutSchema);
