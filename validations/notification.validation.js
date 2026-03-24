import Joi from "joi";
import { isValidObjectId } from "mongoose";
import { RECIPIENT_TYPES } from "../utils/constants.js";

const objectId = Joi.string().hex().length(24);
const internalObjectId = Joi.any().custom((value, helpers) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (isValidObjectId(value)) {
    return value;
  }

  return helpers.error("any.invalid");
}, "ObjectId validation");

const createNotificationPayloadValidator = Joi.object({
  title: Joi.string().trim().required(),
  message: Joi.string().trim().required(),
  notificationType: Joi.string().trim().required(),
  recipientType: Joi.string()
    .valid(...Object.values(RECIPIENT_TYPES))
    .required(),
  userId: Joi.when("recipientType", {
    is: RECIPIENT_TYPES.USER,
    then: internalObjectId.required(),
    otherwise: internalObjectId.optional(),
  }),
  customerId: Joi.when("recipientType", {
    is: RECIPIENT_TYPES.CUSTOMER,
    then: internalObjectId.required(),
    otherwise: internalObjectId.optional(),
  }),
  adminId: internalObjectId.optional(),
  entityId: Joi.any().optional(),
  recipientRole: Joi.string().trim().optional(),
}).unknown(true);

const getNotificationsValidator = {
  query: Joi.object({
    notificationType: Joi.string().trim().optional(),
    entityType: Joi.string().trim().optional(),
    isRead: Joi.boolean().optional(),
    page: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().trim().optional(),
    populate: Joi.string().trim().optional(),
  }),
};

const markSingleReadValidator = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

const markAllReadValidator = {
  body: Joi.object({
    entityType: Joi.string().trim().optional(),
  }),
};

const getNotificationCountValidator = {
  query: Joi.object({
    entityType: Joi.string().trim().optional(),
  }),
};

const getCustomerNotificationsValidator = {
  params: Joi.object({
    adminId: objectId.required(),
    customerId: objectId.required(),
  }),
  query: Joi.object({
    notificationType: Joi.string().trim().optional(),
    entityType: Joi.string().trim().optional(),
    isRead: Joi.boolean().optional(),
    page: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().trim().optional(),
    populate: Joi.string().trim().optional(),
  }),
};

const markAllCustomerNotificationsReadValidator = {
  body: Joi.object({
    adminId: objectId.required(),
    customerId: objectId.required(),
    entityType: Joi.string().trim().optional(),
  }),
};

export {
  createNotificationPayloadValidator,
  getNotificationsValidator,
  markSingleReadValidator,
  markAllReadValidator,
  getNotificationCountValidator,
  getCustomerNotificationsValidator,
  markAllCustomerNotificationsReadValidator,
};
