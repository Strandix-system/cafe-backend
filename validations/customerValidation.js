import Joi from "joi";

const customerValidation = {

  create: Joi.object({

    name: Joi.string()
      .min(2)
      .max(50)
      .required(),

    phoneNumber: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .required(),

    qrId: Joi.string().required(),
  }),
};

export default customerValidation;
