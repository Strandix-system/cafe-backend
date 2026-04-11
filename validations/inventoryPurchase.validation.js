import Joi from 'joi';

import { PURCHASE_UNIT_ENUM } from '../utils/constants.js';

const createPurchaseValidation = {
  body: Joi.object({
    supplierId: Joi.string().hex().length(24).required(),

    invoiceNumber: Joi.string().trim().required(),

    totalAmount: Joi.number().min(0).required(),

    purchasedAt: Joi.date().optional(),

    note: Joi.string().trim().allow('').optional(),

    items: Joi.array()
      .items(
        Joi.object({
          inventoryItemId: Joi.string().hex().length(24).required(),

          quantity: Joi.number().min(1).required(),

          unit: Joi.string()
            .valid(...PURCHASE_UNIT_ENUM)
            .required(),

          purchasePrice: Joi.number().min(0).required(),

          totalPrice: Joi.number().min(0).required(),
        }).unknown(false),
      )
      .min(1)
      .required(),
  }).unknown(false),
};

// const updatePurchaseValidation = {
//   params: Joi.object({
//     purchaseId: Joi.string().hex().length(24).required(),
//   }),

//   body: Joi.object({
//     supplierId: Joi.string().hex().length(24).optional(),

//     invoiceNumber: Joi.string().trim().optional(),

//     totalAmount: Joi.number().min(0).optional(),

//     purchasedAt: Joi.date().optional(),

//     note: Joi.string().trim().allow('').optional(),

//     items: Joi.array().items(
//       Joi.object({
//         inventoryItemId: Joi.string().hex().length(24).required(),

//         quantity: Joi.number().min(1).required(),

//         unit: Joi.string().valid(...PURCHASE_UNIT_ENUM).required(),

//         purchasePrice: Joi.number().min(0).required(),

//         totalPrice: Joi.number().min(0).required(),
//       }).unknown(false)
//     ),
//   })
//     .min(1)
//     .unknown(false),
// };

export {
  createPurchaseValidation,
  // updatePurchaseValidation,
};
