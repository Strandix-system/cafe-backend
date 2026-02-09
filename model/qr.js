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
        },
        qrCodeUrl: {
            type: String,
            required: true,
        },
        token: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);
qrSchema.plugin(paginate);
export default mongoose.model("Qr", qrSchema);
