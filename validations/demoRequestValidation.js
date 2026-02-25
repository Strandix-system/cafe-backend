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

    message: Joi.string().trim().max(500).optional().allow(""),
  }),
};


const updateDemoStatus = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),

  body: Joi.object({
    status: Joi.string()
      .valid("accepted", "rejected")
      .required(),
  }),
};




export default {
  createDemoRequest,
  updateDemoStatus,

};