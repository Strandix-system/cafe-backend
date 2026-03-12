import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const createOrderValidator = {
  body: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          menuId: objectId.required(),
          quantity: Joi.number().integer().min(1).required(),
        })
      )
      .min(1)
      .required(),
    specialInstruction: Joi.string().trim().allow("").optional(),
    customerId: objectId.required(),
    tableNumber: Joi.number().integer().min(1).required(),
  }),
};

const updatePaymentStatusValidator = {
  body: Joi.object({
    orderId: objectId.required(),
    paymentStatus: Joi.boolean().strict().required(),
  }),
};

const updateOrderStatusValidator = {
  body: Joi.object({
    orderId: objectId.required(),
    status: Joi.string().trim().lowercase().valid("pending", "accepted", "completed").optional(),
    orderStatus: Joi.string().trim().lowercase().valid("pending", "accepted", "completed").optional(),
  }).or("status", "orderStatus"),
};

const orderIdParamValidator = {
  params: Joi.object({
    orderId: objectId.required(),
  }),
};

const orderBillIdParamValidator = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

const getOrdersQueryValidator = {
  query: Joi.object({
    orderStatus: Joi.string().trim().lowercase().valid("pending", "accepted", "completed").optional(),
    tableNumber: Joi.number().integer().min(1).optional(),
    paymentStatus: Joi.boolean().optional(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().trim().optional(),
    populate: Joi.string().trim().optional(),
  }),
};

const getMyOrdersQueryValidator = {
  query: Joi.object({
    userId: objectId.required(),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).optional(),
    sortBy: Joi.string().trim().optional(),
    populate: Joi.string().trim().optional(),
  }),
};

export {
  createOrderValidator,
  updatePaymentStatusValidator,
  updateOrderStatusValidator,
  orderIdParamValidator,
  orderBillIdParamValidator,
  getOrdersQueryValidator,
  getMyOrdersQueryValidator,
};
