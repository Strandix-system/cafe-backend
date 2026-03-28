import mongoose from 'mongoose';

import { paginate } from '../model/plugin/paginate.plugin.js';
import { ISSUE_STATUSES } from '../utils/constants.js';

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
      enum: Object.values(ISSUE_STATUSES),
      default: ISSUE_STATUSES.PENDING,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

issueReportedSchema.plugin(paginate);

export const IssueReported = mongoose.model(
  'IssueReported',
  issueReportedSchema,
);
