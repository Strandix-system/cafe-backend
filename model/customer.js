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
        tableNumber: {
            type: Number,
            required: true,
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        qrId: {                
            type: mongoose.Schema.Types.ObjectId,
            ref: "Qr",
        },
    },
    { timestamps: true }
);
customerSchema.plugin(paginate);
customerSchema.index(
    { adminId: 1, phoneNumber: 1 },
    { unique: true }
);

export default mongoose.model("Customer", customerSchema);