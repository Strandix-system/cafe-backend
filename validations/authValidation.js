import Joi from "joi";

const registerValidator = {
  body: Joi.object().keys({
    email: Joi.string()
      .email()
      .min(5)
      .max(2000)
      .trim()
      .required(),

    password: Joi.string()
      .min(6)
      .max(30)
      .required(),

    role: Joi.string()
      .valid("superadmin")
      .default("superadmin"),
  }).unknown(true),
};

const loginValidator = {
  body: Joi.object().keys({
    email: Joi.string()
      .email()
      .min(5)
      .max(2000)
      .trim(),

       phoneNumber: Joi.string()
        .length(10)
        .pattern(/^[0-9]+$/),

    password: Joi.string()
      .min(6)
      .max(30)
      .required(),
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