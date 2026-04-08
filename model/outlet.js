import mongoose from 'mongoose';

import indiaStates from '../config/indiaStates.js';
import { paginate } from './plugin/paginate.plugin.js';

const outletSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    phoneNumber: {
      type: Number,
      default: null,
    },
    address: {
      street: { type: String, trim: true, default: null },
      city: { type: String, trim: true, default: null },
      state: { type: String, trim: true, enum: indiaStates, default: null },
      pincode: { type: Number, default: null },
    },
    hours: {
      weekdays: { type: String, default: null },
      weekends: { type: String, default: null },
    },
    isMain: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

outletSchema.index(
  { adminId: 1, name: 1 },
  {
    unique: true,
  },
);

outletSchema.plugin(paginate);

export default mongoose.model('Outlet', outletSchema);
