import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { paginate } from '../model/plugin/paginate.plugin.js';
import { STAFF_ROLE } from '../utils/constants.js';

const staffSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
      trim: true,
      default: null,
    },
    profileImage: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false,
    },
    role: {
      type: String,
      default: STAFF_ROLE.WAITER,
      enum: Object.values(STAFF_ROLE),
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

staffSchema.index(
  { adminId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string' } },
  },
);
staffSchema.index(
  { adminId: 1, phoneNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { phoneNumber: { $type: 'number' } },
  },
);

staffSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

staffSchema.plugin(paginate);

export const Staff = mongoose.model('Staff', staffSchema);
