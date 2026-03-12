import Joi from "joi";

const objectIdRule = Joi.string().hex().length(24);
const phoneRule = Joi.number().min(6000000000).max(9999999999).strict();
const razorpayPaymentIdRule = Joi.string().trim().pattern(/^pay_[A-Za-z0-9]+$/);
const razorpaySubscriptionIdRule = Joi.string().trim().pattern(/^sub_[A-Za-z0-9]+$/);
const razorpaySignatureRule = Joi.string().trim().pattern(/^[a-fA-F0-9]{64}$/);

export const createSubscriptionValidation = {
  body: Joi.object().keys({
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().trim().lowercase().required(),
    phoneNumber: phoneRule.required(),
    planId: Joi.string().trim().optional(),
  }),
};

export const verifySubscriptionValidation = {
  body: Joi.object().keys({
    razorpay_payment_id: razorpayPaymentIdRule.required(),
    razorpay_subscription_id: razorpaySubscriptionIdRule.required(),
    razorpay_signature: razorpaySignatureRule.required(),
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().trim().lowercase().required(),
    phoneNumber: phoneRule.required(),
    password: Joi.string().min(6).max(32).required(),
  }),
};

export const getTransactionsValidation = {
  query: Joi.object().keys({
    status: Joi.string().valid("created", "active", "cancelled", "completed", "expired").optional(),
    userId: objectIdRule.optional(),
    adminId: objectIdRule.optional(),
    search: Joi.string().trim().optional(),
    fromDate: Joi.date().iso().optional(),
    toDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(0).max(100).optional(),
    sortBy: Joi.string().trim().optional(),
    populate: Joi.string().trim().optional(),
  }),
};

export const renewSubscriptionValidation = {
  body: Joi.object().max(0),
};

export const verifyRenewSubscriptionValidation = {
  body: Joi.object().keys({
    razorpay_payment_id: razorpayPaymentIdRule.required(),
    razorpay_subscription_id: razorpaySubscriptionIdRule.required(),
    razorpay_signature: razorpaySignatureRule.required(),
  }),
};
