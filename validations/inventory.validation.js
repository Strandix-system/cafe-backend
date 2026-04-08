import Joi from 'joi';
import mongoose from 'mongoose';

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid ObjectId');
  }
  return value;
};

const createInventoryValidation = {
  body: Joi.object({
    name: Joi.string().trim().required(),
    image: Joi.any(),
    category: Joi.string().custom(objectId).required(),

    unit: Joi.string()
      .valid('ml', 'L', 'g', 'kg', 'pcs', 'packets', 'box', 'dozen')
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
    name: Joi.string().trim().optional(),
    image: Joi.any(),

    category: Joi.string().custom(objectId).optional(),

    unit: Joi.string()
      .valid('ml', 'L', 'g', 'kg', 'pcs', 'packets', 'box', 'dozen')
      .optional(),

    currentStock: Joi.number().min(0).optional(),
    minStockLevel: Joi.number().min(0).optional(),

    isActive: Joi.boolean().optional(),
  }).min(1),
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
