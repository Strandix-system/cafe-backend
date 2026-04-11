import mongoose from 'mongoose';

import { INVENTORY_BASE_UNITS } from '../utils/constants.js';

import { paginate } from './plugin/paginate.plugin.js';

const recipeSchema = new mongoose.Schema(
  {
    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: true,
      unique: true,
      index: true,
    },

    ingredients: [
      {
        inventoryItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Inventory',
          required: true,
        },

        name: {
          type: String,
          required: true,
          trim: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 0,
        },

        unit: {
          type: String,
          enum: INVENTORY_BASE_UNITS,
          required: true,
        },

        wastagePercent: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },

        isOptional: {
          type: Boolean,
          default: false,
        },
      },
    ],

    note: {
      type: String,
      default: '',
      trim: true,
    },

    preparationInstructions: {
      type: [String],
      default: [],
    },

    servingSize: {
      type: Number,
      default: 1,
      min: 1,
    },

    preparationTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

recipeSchema.plugin(paginate);

export const Recipe = mongoose.model('Recipe', recipeSchema);
