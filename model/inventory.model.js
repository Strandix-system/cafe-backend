import mongoose from 'mongoose';

import { paginate } from './plugin/paginate.plugin.js';

const inventorySchema = new mongoose.Schema(
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
    image: {
      type: String,
      trim: true,
      required: false,
      default: null,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    unit: {
      type: String,
      enum: ['kg', 'gram', 'liter', 'ml', 'pcs', 'packet'],
      required: true,
    },
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    minStockLevel: {
      type: Number,
      default: 0,
      min: 0,
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

inventorySchema.index(
  {
    adminId: 1,
    name: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
    },
  },
);

inventorySchema.plugin(paginate);

export const Inventory = mongoose.model('Inventory', inventorySchema);
