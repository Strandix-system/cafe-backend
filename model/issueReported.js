import mongoose from "mongoose";
import { paginate } from "../model/plugin/paginate.plugin.js";

const issueReportedSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            required: true,
        },
        images: {
            type: [String],
            default: [],
        },
        description: {
            type: String,
            trim: true,
            required: true,
        },
        ticketId: {
            type: String,
            unique: true,
            required: true,
            index: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "in_progress", "resolve"],
            default: "pending",
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

issueReportedSchema.plugin(paginate);

export default mongoose.model("IssueReported", issueReportedSchema);
