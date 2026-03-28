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

const createOfflineOrderSchema = {
    body: Joi.object({
        tableNumber: Joi.number().min(1).required(),
        customer: Joi.object({
            name: Joi.string().min(2).max(50).required(),
            phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
        }).required(),
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

const changeTableSchema = {
    body: Joi.object({
        orderId: objectId.required(),
        newTableNumber: Joi.number().min(1).required(),
    }),
};

export { createOrderSchema, createOfflineOrderSchema, getActiveOrderSchema, getOrdersSchema, updateIsCompletedSchema, getMyOrdersSchema, updatePaymentStatusSchema, getBillSchema, deleteOrderSchema, changeTableSchema };   
