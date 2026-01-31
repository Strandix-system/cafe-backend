import mongoose from "mongoose";
import User from "./user.js"
import { paginate } from "../model/plugin/paginate.plugin.js"

const menuSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        image: {
            type: String, 
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        discountPrice: {
            type: Number,
        },
    },
    { timestamps: true }
);
menuSchema.plugin(paginate)
export default mongoose.model("Menu", menuSchema);