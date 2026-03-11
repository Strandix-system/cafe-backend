import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js"

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        adminId: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }],
        customerStatus: {
            type: String,
            enum: ["new", "frequent", "vip"],
            default: "new",
            lowercase: true,
            trim: true,
        },
    },
    { timestamps: true }
);
customerSchema.plugin(paginate);
customerSchema.index(
    { adminId: 1, phoneNumber: 1 },
    { unique: true }
);

export const Customer = mongoose.model("Customer", customerSchema);


