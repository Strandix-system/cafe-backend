import mongoose from 'mongoose';

import { paginate } from './plugin/paginate.plugin.js';

const supplierSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    gstNumber: {
      type: String,
      default: '',
      trim: true,
    },

    note: {
      type: String,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // createdBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    //   required: true,
    // },

    // updatedBy: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    // },
  },
  {
    timestamps: true,
  },
);

supplierSchema.index({ adminId: 1, name: 1 }, { unique: true });

supplierSchema.index({ adminId: 1, isActive: 1 });
supplierSchema.index({ name: 'text', phone: 'text' });

supplierSchema.plugin(paginate);

export const Supplier = mongoose.model('Supplier', supplierSchema);
