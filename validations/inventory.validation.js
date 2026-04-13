import Joi from 'joi';
import mongoose from 'mongoose';

import { PURCHASE_UNIT_ENUM } from '../utils/constants.js';

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid ObjectId');
  }
  return value;
};

const createInventoryValidation = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).lowercase().required(),

    image: Joi.any(),

    category: Joi.string().custom(objectId).required(),

    unit: Joi.string()
      .valid(...PURCHASE_UNIT_ENUM)
      .required(),

    currentStock: Joi.number().min(0).optional(),

    minStockLevel: Joi.number().min(0).optional(),
  }),
};

const updateInventoryValidation = {
  params: Joi.object({
    id: Joi.string().custom(objectId).required(),
  }),

  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).lowercase().optional(),

    category: Joi.string().custom(objectId).optional(),

    image: Joi.any().optional(),

    unit: Joi.string()
      .valid(...PURCHASE_UNIT_ENUM)
      .optional(),

    currentStock: Joi.number().min(0).optional(),

    minStockLevel: Joi.number().min(0).optional(),

    isActive: Joi.boolean().truthy('true').falsy('false').optional(),
  }),
};

const getInventoryByIdValidation = {
  params: Joi.object({
    id: Joi.string().custom(objectId).required(),
  }),
};

export {
  createInventoryValidation,
  updateInventoryValidation,
  getInventoryByIdValidation,
};
