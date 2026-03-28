import Joi from "joi";

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createOrderSchema = {
    body: Joi.object({
        customerId: objectId.required(),
        adminId: objectId.required(),
        tableNumber: Joi.number().required(),
        items: Joi.array()
            .items(
                Joi.object({
                    menuId: objectId.required(),
                    quantity: Joi.number().min(1).required(),
                    specialInstruction: Joi.string().trim().allow("", null).max(200).optional(),
                })
            )
            .min(1)
            .required(),
    }),
};

const getOrdersSchema = {
    query: Joi.object({
        isCompleted: Joi.boolean().optional(),
        page: Joi.number().optional(),
        limit: Joi.number().optional(),
        populate: Joi.any().optional(),
    }),
};

const getMyOrdersSchema = {
    query: Joi.object({
        userId: objectId.required(),
        page: Joi.number().optional(),
        limit: Joi.number().optional(),
    }),
};

const updateIsCompletedSchema = {
    body: Joi.object({
        orderId: objectId.required(),
        isCompleted: Joi.boolean().required(),
    }),
};

const updatePaymentStatusSchema = {
    body: Joi.object({
        orderId: objectId.required(),
        paymentStatus: Joi.boolean().required(),
    }),
};

const deleteOrderSchema = {
    params: Joi.object({
        orderId: objectId.required(),
    }),
};

const getBillSchema = {
    params: Joi.object({
        orderId: objectId.optional(),
        id: objectId.optional(),
    }).or("orderId", "id"),
};

const getActiveOrderSchema = {
    params: Joi.object({
        qrId: objectId.required(),
    }),
};

const baseChangeTableSchema = {
  orderId: objectId.required(),
  newTableNumber: Joi.number().min(1).required(),
};

const changeTableSchema = {
  body: Joi.object({
    ...baseChangeTableSchema,
  }),
};

const changeTablePublicSchema = {
  body: Joi.object({
    ...baseChangeTableSchema,
    qrId: objectId.required(),
  }),
};

export { createOrderSchema, getActiveOrderSchema, getOrdersSchema, updateIsCompletedSchema, getMyOrdersSchema, updatePaymentStatusSchema, getBillSchema, deleteOrderSchema, changeTableSchema, changeTablePublicSchema
 };   