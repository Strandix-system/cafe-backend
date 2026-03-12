import Joi from "joi";

const createDemoRequest = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),

    phone: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone number must be 10 digits",
      }),

    email: Joi.string().email().optional().allow(""),

    cafeName: Joi.string().trim().min(2).max(100).required(),

    city: Joi.string().trim().min(2).max(50).required(),

    message: Joi.string().trim().min(30).max(500).optional().allow(""),
  }),
};


const updateDemoStatus = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),

  body: Joi.object({
    status: Joi.string()
      .valid("requested", "full_filled", "inquiry", "not_interested")
      .required(),
  }),
};
const getDemoRequestById = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};

const getAllDemoRequests = {
  query: Joi.object({
    search: Joi.string().trim().optional(),
    status: Joi.string().trim().lowercase().valid("requested", "full_filled", "inquiry", "not_interested").optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().trim().optional(),
    populate: Joi.string().trim().optional(),
  }),
};
export {
  createDemoRequest,
  updateDemoStatus,
  getDemoRequestById,
  getAllDemoRequests,
};
