import mongoose from "mongoose";

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
export default mongoose.model("Qr", qrSchema);
