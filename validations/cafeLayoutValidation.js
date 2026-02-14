import Joi from 'joi';
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
            id: Joi.string().hex().length(24).required() 
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
    }
};