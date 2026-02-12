import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js"

const menuSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String, 
            required: true,
            trim: true,
        },
        description: {
            type: String,
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
        isPopular: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);
menuSchema.plugin(paginate)
export default mongoose.model("Menu", menuSchema);