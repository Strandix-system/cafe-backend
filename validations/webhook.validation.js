import Joi from "joi";

const razorpayWebhookValidator = {
  body: Joi.any().required(),
};

export { razorpayWebhookValidator };
