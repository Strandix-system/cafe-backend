import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const createQrValidator = {
  body: Joi.object({
    totalTables: Joi.number().integer().min(1).required(),
    adminId: objectId.required(),
  }),
};

const scanQrValidator = {
  params: Joi.object({
    qrId: objectId.required(),
  }),
};

const getAllQrQueryValidator = {
  query: Joi.object({
    search: Joi.string().trim().optional(),
    tableNumber: Joi.number().integer().min(1).optional(),
    adminId: objectId.optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    populate: Joi.string().trim().optional(),
  }),
};

const layoutIdParamValidator = {
  params: Joi.object({
    layoutId: objectId.required(),
  }),
};

export { createQrValidator, scanQrValidator, getAllQrQueryValidator, layoutIdParamValidator };
