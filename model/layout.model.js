import mongoose from "mongoose";
import { paginate } from "./plugin/paginate.plugin.js"

const layoutSchema = new mongoose.Schema({
  noOfImage: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  defaultLayoutId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CafeLayout",
    default: null
  },
}, { timestamps: true });

layoutSchema.plugin(paginate)

export default mongoose.model("Layout", layoutSchema);
