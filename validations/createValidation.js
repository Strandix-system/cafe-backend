import Joi from "joi";
import emailValidator from "email-validator";


const objectId = Joi.string().hex().length(24);

const nameRule = Joi.string()
    .trim()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z ]+$/);

const emailRule = Joi.string()
    .trim()
    .lowercase()
    .max(100)
    .custom((value, helpers) => {
        if (!emailValidator.validate(value)) {
            return helpers.message("Invalid email address");
        }
        return value;
    });

const phoneRule = Joi.string()
    .pattern(/^[6-9][0-9]{9}$/); 

const passwordRule = Joi.string()
    .min(8)
    .max(32)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/);

const addressRule = Joi.string()
    .trim()
    .min(5)
    .max(200);

const pincodeRule = Joi.string()
    .pattern(/^[0-9]{6}$/);

const createAdminValidator = {
    body: Joi.object({
        firstName: nameRule.required(),
        lastName: nameRule.required(),

        cafeName: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .required(),

        email: emailRule.required(),

        phoneNumber: phoneRule.required(),

        password: passwordRule.required(),

        address: addressRule.required(),

        state: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .required(),

        city: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .required(),

        pincode: pincodeRule.required(),
    }).required(),
};

const updateAdminValidator = {
    params: Joi.object({
        id: objectId.required(),
    }),

    body: Joi.object({
        firstName: nameRule,
        lastName: nameRule,

        cafeName: Joi.string().trim().min(2).max(100),

        email: emailRule,

        phoneNumber: phoneRule,

        password: passwordRule,

        address: addressRule,

        state: Joi.string().trim().min(2).max(50),

        city: Joi.string().trim().min(2).max(50),

        pincode: pincodeRule,
    })
        .min(1)
        .required(),
};

const deleteAdminValidator = {
    params: Joi.object().keys({
        id: Joi.string()
            .hex()
            .length(24)
            .required(),
    }),
};

const listAdminsValidator = {
    query: Joi.object({
        page: Joi.number().integer().min(0).default(0),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string().default("createdAt:desc"),
    }),
};

export {
    createAdminValidator,
    updateAdminValidator,
    deleteAdminValidator,
    listAdminsValidator
};
