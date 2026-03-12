import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

export const cafeLayoutValidation = {
    create: {
        body: Joi.object({
            menuTitle: Joi.string().trim().required(),
            layoutTitle: Joi.string().trim().required(),
            aboutTitle: Joi.string().trim().required(),
            aboutDescription: Joi.string().trim().min(10).required(),
            cafeDescription: Joi.string().trim().min(10).required(),
            homeImage: Joi.any(),
            aboutImage: Joi.any()
        })
    },
    update: {
        params: Joi.object({
            id: objectId.required()
        }),
        body: Joi.object({
            menuTitle: Joi.string().trim(),
            layoutTitle: Joi.string().trim(),
            aboutTitle: Joi.string().trim(),
            aboutDescription: Joi.string().trim().min(10),
            cafeDescription: Joi.string().trim().min(10),
            homeImage: Joi.any(),
            aboutImage: Joi.any()
        }).min(0)
    },
    updateStatus: {
        body: Joi.object({
            layoutId: objectId.required(),
            active: Joi.boolean().strict().required()
        })
    },
    idParam: {
        params: Joi.object({
            id: objectId.required()
        })
    },
    adminLayoutQuery: {
        query: Joi.object({
            adminId: objectId.optional(),
            search: Joi.string().trim().optional(),
            defaultLayout: Joi.string().valid("true", "false").optional(),
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).optional(),
            populate: Joi.string().trim().optional()
        })
    },
    allLayoutsQuery: {
        query: Joi.object({
            adminId: objectId.optional(),
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).optional(),
            sortBy: Joi.string().trim().optional(),
            populate: Joi.string().trim().optional()
        })
    }
};
