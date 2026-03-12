import Joi from "joi";

const objectId = Joi.string().hex().length(24);
const phoneRule = Joi.string().pattern(/^[0-9]{10}$/);

const createCustomerValidator = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    phoneNumber: phoneRule.required(),
    adminId: objectId.required(),
  }),
};

const updateCustomerValidator = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50).optional(),
    phoneNumber: phoneRule.optional(),
    adminId: Joi.required(),
  }).min(1),
};

const idParamValidator = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

const getCustomersQueryValidator = {
  query: Joi.object({
    search: Joi.string().trim().optional(),
    adminId: objectId.optional(),
    status: Joi.string().trim().lowercase().valid("new", "frequent", "vip").optional(),
    page: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().trim().optional(),
    populate: Joi.string().trim().optional(),
  }),
};

export {
  createCustomerValidator,
  updateCustomerValidator,
  idParamValidator,
  getCustomersQueryValidator,
};
