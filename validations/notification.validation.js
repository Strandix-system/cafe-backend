import Joi from "joi";
import { ENTITY_TYPES } from "../utils/constants.js";

const objectId = Joi.string().hex().length(24);
const entityType = Joi.string()
  .trim()
  .valid(...Object.values(ENTITY_TYPES));

const getNotificationsValidator = {
  query: Joi.object({
    notificationType: Joi.string().trim().optional(),
    entityType: entityType.optional(),
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

const deleteNotificationValidator = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

const markAllReadValidator = {
  body: Joi.object({
    entityType: entityType.optional(),
  }),
};

const getCustomerNotificationsValidator = {
  params: Joi.object({
    customerId: objectId.required(),
  }),
  query: Joi.object({
    notificationType: Joi.string().trim().optional(),
    entityType: entityType.optional(),
    isRead: Joi.boolean().optional(),
    page: Joi.number().integer().min(0).optional(),
    limit: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().trim().optional(),
    populate: Joi.string().trim().optional(),
  }),
};

const markAllCustomerNotificationsReadValidator = {
  body: Joi.object({
    customerId: objectId.required(),
    entityType: entityType.optional(),
  }),
};

export {
  getNotificationsValidator,
  markSingleReadValidator,
  deleteNotificationValidator,
  markAllReadValidator,
  getCustomerNotificationsValidator,
  markAllCustomerNotificationsReadValidator,
};
