import Joi from "joi";

const phoneRule = Joi.number().integer().min(6000000000).max(9999999999).strict();
const registerValidator = {
  body: Joi.object().keys({
    email: Joi.string().email().min(5).max(2000).trim().required(),
    phoneNumber: phoneRule.required(),
    role: Joi.string().valid("superadmin").default("superadmin"),
  }).unknown(true),
};

const loginValidator = {
  body: Joi.object().keys({
    email: Joi.string().email().min(5).max(2000).trim(),
    phoneNumber: phoneRule,
    password: Joi.string().min(6).max(30).required(),
  })
    .or("email", "phoneNumber")
    .unknown(true),

};

const logoutValidator = {
  headers: Joi.object({
    authorization: Joi.string().required(),
  }).unknown(true),
};


export {
  registerValidator,
  loginValidator,
  logoutValidator
};