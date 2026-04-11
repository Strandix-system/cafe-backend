import mongoose from 'mongoose';

import { paginate } from './plugin/paginate.plugin.js';

const purchaseSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    purchasedAt: {
      type: Date,
      default: Date.now,
    },

    note: {
      type: String,
      default: '',
      trim: true,
    },

    items: [
      {
        inventoryItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Inventory',
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        unit: {
          type: String,
          enum: ['ml', 'l', 'g', 'kg', 'pcs', 'dozen'],
          required: true,
        },

        baseUnit: {
          type: String,
          enum: ['ml', 'g', 'pcs'],
          required: true,
        },

        convertedQuantity: {
          type: Number,
          required: true,
          min: 0,
        },

        purchasePrice: {
          type: Number,
          required: true,
          min: 0,
        },

        totalPrice: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

purchaseSchema.pre('save', function (next) {
  let total = 0;

  for (const item of this.items) {
    const expected = item.quantity * item.purchasePrice;

    if (item.totalPrice !== expected) {
      return next(new Error('Invalid totalPrice'));
    }

    if (!item.convertedQuantity) {
      return next(new Error('convertedQuantity missing'));
    }

    total += item.totalPrice;
  }

  if (this.totalAmount !== total) {
    return next(new Error('totalAmount mismatch'));
  }

  next();
});

purchaseSchema.index({ adminId: 1, invoiceNumber: 1 }, { unique: true });

purchaseSchema.plugin(paginate);

export const InventoryPurchase = mongoose.model(
  'InventoryPurchase',
  purchaseSchema,
);
