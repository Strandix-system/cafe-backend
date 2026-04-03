import Joi from "joi";
import { CATEGORY_TYPES } from "../utils/constants.js";

const createCategorySchema = {
  body: Joi.object({
    name: Joi.string().trim().min(1).max(100).required(),
    type: Joi.string()
      .valid(CATEGORY_TYPES.MENU, CATEGORY_TYPES.INVENTORY)
      .required(),
  }),
};

const updateCategorySchema = {
  params: Joi.object({
    categoryId: Joi.string().hex().length(24).required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional(),
    type: Joi.string()
      .valid(CATEGORY_TYPES.MENU, CATEGORY_TYPES.INVENTORY)
      .optional(),
  }).min(1),
};

export { createCategorySchema, updateCategorySchema };
