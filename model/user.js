import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import indiaStates from '../config/indiaStates.js';
import { paginate } from '../model/plugin/paginate.plugin.js';
import { GST_TYPES } from '../utils/constants.js';

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    cafeName: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phoneNumber: {
      type: Number,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },

    address: {
      street: { type: String, trim: true, default: null },
      city: { type: String, trim: true, default: null },
      state: { type: String, trim: true, enum: indiaStates, default: null },
      pincode: { type: Number, trim: true, default: null },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      trim: true,
      required: false,
      default: null,
    },
    logo: {
      type: String,
      default: null,
      required: false,
    },
    gst: {
      gstNumber: { type: String, trim: true, default: null },
      gstPercentage: { type: Number, required: false, default: null },
      gstType: {
        type: String,
        enum: [...Object.values(GST_TYPES), null],
        default: null,
      },
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'manager'],
      default: 'admin',
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    hours: {
      weekdays: { type: String, default: null },
      weekends: { type: String, default: null },
    },
    socialLinks: {
      instagram: { type: String, default: null },
      facebook: { type: String, default: null },
      twitter: { type: String, default: null },
    },
    razorpayCustomerId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    razorpaySubscriptionId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
  },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.plugin(paginate);
userSchema.index(
  { 'gst.gstNumber': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'gst.gstNumber': { $type: 'string', $ne: '' },
    },
  },
);
userSchema.index({ role: 1, adminId: 1 });

export default mongoose.model('User', userSchema);
