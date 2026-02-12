import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js"
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    } 
},
  { timestamps: true }
);
categorySchema.plugin(paginate)
export default mongoose.model("Category", categorySchema);