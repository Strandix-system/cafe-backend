import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js"

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: Number,
            required: true,
        }
    },
    { timestamps: true }
);
customerSchema.plugin(paginate)
export default mongoose.model("Customer", customerSchema);