import Joi from "joi";

export const checkEmailValidation = {
  body: Joi.object().keys({
    email: Joi.string().email().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    password: Joi.string().min(6).optional(),  
    phoneNumber: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .optional(),
  }).or("email", "phoneNumber"),
};
