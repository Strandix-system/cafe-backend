import Joi from 'joi';

import { STAFF_TYPES } from '../utils/constants.js';

const phoneRule = Joi.number().integer().min(6000000000).max(9999999999);

export const createStaffSchema = {
  body: Joi.object()
    .keys({
      name: Joi.string().min(2).max(100).trim().required(),
      email: Joi.string().email().min(5).max(2000).trim().empty(''),
      phoneNumber: phoneRule,
      profileImage: Joi.any().optional(),
      password: Joi.string().min(6).max(30).required(),
      staffType: Joi.string()
        .valid(...Object.values(STAFF_TYPES))
        .required(),
      isActive: Joi.boolean().optional(),
    })
    .or('email', 'phoneNumber')
    .unknown(true),
};

export const updateStaffSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),

  body: Joi.object({
    name: Joi.string().min(2).max(100).trim().empty('').optional(),
    email: Joi.string()
      .email()
      .min(5)
      .max(2000)
      .trim()
      .allow('', null)
      .optional(),
    phoneNumber: phoneRule.optional(),
    profileImage: Joi.any().optional(),
    password: Joi.string().min(6).max(30).empty('').optional(),
    staffType: Joi.string().valid(...Object.values(STAFF_TYPES)),
    isActive: Joi.boolean(),
  }).unknown(false),
};

export const listStaffSchema = {
  query: Joi.object({
    adminId: Joi.string().hex().length(24).required(),
    staffType: Joi.string()
      .valid(...Object.values(STAFF_TYPES))
      .optional(),
    isActive: Joi.boolean().optional(),
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(0).optional(),
    sortBy: Joi.string().optional(),
  }).unknown(false),
};
