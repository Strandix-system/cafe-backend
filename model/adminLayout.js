import mongoose from "mongoose";

const cafeLayoutSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  layoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LayoutTemplate",
    required: true
  },
  cafeName: {
    type: String,
    required: true,
    trim: true
  },
  title: {
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

const CafeLayout =
  mongoose.models.CafeLayout ||
  mongoose.model("CafeLayout", cafeLayoutSchema);

export default CafeLayout;
