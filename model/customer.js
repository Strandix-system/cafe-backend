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
<<<<<<< feat/onboard
        }
=======
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
>>>>>>> main
    },
    { timestamps: true }
);
customerSchema.plugin(paginate);
customerSchema.index(
    { adminId: 1, phoneNumber: 1 },
    { unique: true }
);

export default mongoose.model("Customer", customerSchema);