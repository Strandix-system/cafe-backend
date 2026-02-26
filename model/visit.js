import mongoose from "mongoose";
import { paginate } from "./plugin/paginate.plugin.js";

const visitSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  visitedAt: {
    type: Date,
    default: Date.now,
  },
});
visitSchema.plugin(paginate);
export default mongoose.model("Visit", visitSchema);