import mongoose from "mongoose";
import { paginate } from "./plugin/paginate.plugin.js";

const qrSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tableNumber: {
            type: Number,
            required: true,
            min: 1,
        },
        layoutId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CafeLayout",
            required: true,
        },
        qrCodeUrl: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

qrSchema.plugin(paginate);
qrSchema.index({ adminId: 1, tableNumber: 1 }, { unique: true });
export default mongoose.model("Qr", qrSchema);
