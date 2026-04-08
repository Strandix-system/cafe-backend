import mongoose from 'mongoose';

import { paginate } from '../model/plugin/paginate.plugin.js';
const cafeLayoutSchema = new mongoose.Schema(
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

    homeImage: { type: String, required: true },
    aboutImage: { type: String, required: true },

    menuTitle: { type: String, required: true },
    layoutTitle: { type: String, required: true },
    aboutTitle: { type: String, required: true },
    aboutDescription: { type: String, required: true },
    cafeDescription: { type: String, required: true },

    defaultLayout: {
      type: Boolean,
      default: false,
    },
    defaultLayoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CafeLayout',
      default: null,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
cafeLayoutSchema.virtual('menus', {
  ref: 'Menu', // The name of your Menu model
  localField: 'outletId', // Field in CafeLayout
  foreignField: 'outletId', // Field in Menu
});

cafeLayoutSchema.plugin(paginate);

export default mongoose.model('CafeLayout', cafeLayoutSchema);
