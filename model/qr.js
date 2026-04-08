import mongoose from 'mongoose';

import { paginate } from './plugin/paginate.plugin.js';

const qrSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    outletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Outlet',
      default: null,
      index: true,
    },
    tableNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    qrCodeUrl: {
      type: String,
      default: '',
    },
    occupied: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

qrSchema.plugin(paginate);
qrSchema.index({ adminId: 1, outletId: 1, tableNumber: 1 }, { unique: true });
export default mongoose.model('Qr', qrSchema);
