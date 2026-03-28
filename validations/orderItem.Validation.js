import Joi from 'joi';

import { ORDER_STATUS } from '../utils/constants.js';
// reusable ObjectId validator
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const updateItemStatusSchema = {
  body: Joi.object({
    orderItemId: objectId.required(),
    orderId: objectId.required(),
    status: Joi.string()
      .valid(...Object.values(ORDER_STATUS))
      .required()
      .messages({
        'any.only': 'Invalid order status',
        'string.empty': 'Status is required',
      }),
  }),
};
const updateQuantitySchema = {
  body: Joi.object({
    orderItemId: objectId.required(),
    orderId: objectId.optional(),
    quantity: Joi.number().min(1).required(),
    customerId: objectId.optional(),
    userId: objectId.optional(),
  }),
};
const deleteItemSchema = {
  params: Joi.object({
    orderItemId: objectId.required(),
  }),
};
const getItemsSchema = {
  params: Joi.object({
    orderId: objectId.required(),
  }),
};
export {
  updateItemStatusSchema,
  deleteItemSchema,
  updateQuantitySchema,
  getItemsSchema,
};
