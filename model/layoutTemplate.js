import mongoose from "mongoose";

const layoutTemplateSchema = new mongoose.Schema({
  noOfImage: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  cafeTitleLabel: {
    type: String,
    required: true,
    trim: true
  },
  descriptionLabel: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

export default mongoose.model("LayoutTemplate", layoutTemplateSchema);
