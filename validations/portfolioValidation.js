import Joi from "joi";

const aboutStatsValidator = {
  params: Joi.object({
    adminId: Joi.string().hex().length(24).required(),
  }),
};

const createCustomerFeedbackValidator = {
  body: Joi.object({
    customerId: Joi.required(),
    adminId: Joi.required(),
    rate: Joi.number().min(1).max(5).required(),
    description: Joi.string().trim().max(1000).allow("").optional().default(""),
  }),
};

const topCustomerFeedbackValidator = {
  params: Joi.object({
    adminId: Joi.string().hex().length(24).required(),
  }),
};

const updatePortfolioFeedbackSelectionValidator = {
  body: Joi.object({
    feedbackIds: Joi.array()
      .items(Joi.string().hex().length(24))
      .max(5)
      .required()
      .unique(),
  }),
};

export {
  aboutStatsValidator,
  createCustomerFeedbackValidator,
  topCustomerFeedbackValidator,
  updatePortfolioFeedbackSelectionValidator,
};
