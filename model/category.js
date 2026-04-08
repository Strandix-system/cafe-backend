import mongoose from 'mongoose';

import { paginate } from '../model/plugin/paginate.plugin.js';
import { CATEGORY_TYPES } from '../utils/constants.js';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [CATEGORY_TYPES.MENU, CATEGORY_TYPES.INVENTORY],
      required: true,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    outletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

categorySchema.index(
  { adminId: 1, outletId: 1, name: 1, type: 1 },
  {
    unique: true,
  },
);

categorySchema.plugin(paginate);

export const Category = mongoose.model('Category', categorySchema);
