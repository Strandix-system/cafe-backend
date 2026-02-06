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
        },
        tableNumber: {
            type: Number,
            required: true,
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);
customerSchema.plugin(paginate)
export default mongoose.model("Customer", customerSchema);