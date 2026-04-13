import mongoose from 'mongoose';

import { paginate } from '../model/plugin/paginate.plugin.js';
import { STOCK_TYPES } from '../utils/constants.js';

const menuSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discountPrice: {
      type: Number,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockStatus: {
      type: String,
      enum: [
        STOCK_TYPES.IN_STOCK,
        STOCK_TYPES.LOW_STOCK,
        STOCK_TYPES.OUT_OF_STOCK,
      ],
      default: STOCK_TYPES.IN_STOCK,
    },
  },
  { timestamps: true },
);
menuSchema.plugin(paginate);
export default mongoose.model('Menu', menuSchema);
