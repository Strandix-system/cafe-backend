import Joi from 'joi';

// Helper for Social Links structure
const socialLinksSchema = Joi.object({
    facebook: Joi.string().uri().allow(''),
    instagram: Joi.string().uri().allow(''),
    twitter: Joi.string().uri().allow(''),
    linkedin: Joi.string().uri().allow(''),
});

// Helper for Operating Hours structure
const hoursSchema = Joi.object({
    monday: Joi.string().allow(''),
    tuesday: Joi.string().allow(''),
    wednesday: Joi.string().allow(''),
    thursday: Joi.string().allow(''),
    friday: Joi.string().allow(''),
    saturday: Joi.string().allow(''),
    sunday: Joi.string().allow(''),
});

export const cafeLayoutValidation = {
    // Schema for CREATE
    create: {
        body: Joi.object({
            menuTitle: Joi.string().trim().required(),
            layoutTitle: Joi.string().trim().required(),
            aboutTitle: Joi.string().trim().required(),
            aboutDescription: Joi.string().trim().min(10).required(),
            cafeDescription: Joi.string().trim().min(10).required(),
            hours: hoursSchema.required(),
            socialLinks: socialLinksSchema.optional(),
        })
    },

    // Schema for UPDATE
    update: {
        params: Joi.object({
            id: Joi.string().hex().length(24).required() // Validates MongoDB ObjectId
        }),
        body: Joi.object({
            menuTitle: Joi.string().trim(),
            layoutTitle: Joi.string().trim(),
            aboutTitle: Joi.string().trim(),
            aboutDescription: Joi.string().trim().min(10),
            cafeDescription: Joi.string().trim().min(10),
            hours: hoursSchema,
            socialLinks: socialLinksSchema,
        }).min(0) // Allows updating just images
    }
};