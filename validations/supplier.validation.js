import Joi from 'joi';
import mongoose from 'mongoose';

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const createSupplierValidation = Joi.object({
  name: Joi.string().trim().required(),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required(),

  address: Joi.string().optional().allow(''),

  gstNumber: Joi.string().optional().allow(''),

  note: Joi.string().optional().allow(''),
});

const updateSupplierValidation = Joi.object({
  name: Joi.string().trim().optional(),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),

  address: Joi.string().optional().allow(''),

  gstNumber: Joi.string().optional().allow(''),

  note: Joi.string().optional().allow(''),

  isActive: Joi.boolean().optional(),
});

const supplierIdParamValidation = Joi.object({
  id: Joi.string().custom(objectId).required(),
});

export {
  createSupplierValidation,
  updateSupplierValidation,
  supplierIdParamValidation,
};
