import mongoose from "mongoose";
import User from "./user.js";
import Category from "./category.js";
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
        category : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
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
    },
    { timestamps: true }
);
menuSchema.plugin(paginate)
export default mongoose.model("Menu", menuSchema);