import Joi from 'joi';
import { ApiError } from '../utils/apiError.js';
import { pick } from '../utils/pick.js';

export const validate = (schema) => (req, res, next) => {
    const validSchema = pick(schema, ['params', 'query', 'body']);
    const object = pick(req, Object.keys(validSchema));
    const { value, error } = Joi.compile(validSchema)
        .prefs({
            errors: { label: 'key' },
            abortEarly: false,
            messages: {
                "any.required": "{{#label}} is required",
                "string.empty": "{{#label}} is required",
                "string.min": "{{#label}} must be at least {{#limit}} characters",
                "string.max": "{{#label}} must be at most {{#limit}} characters",
                "string.email": "{{#label}} must be a valid email",
                "string.pattern.base": "{{#label}} format is invalid",
                "string.length": "{{#label}} length must be {{#limit}}",
                "string.hex": "{{#label}} must be a valid hex string",
                "number.base": "{{#label}} must be a number",
                "number.integer": "{{#label}} must be an integer",
                "number.min": "{{#label}} must be at least {{#limit}}",
                "number.max": "{{#label}} must be less than or equal to {{#limit}}",
                "boolean.base": "{{#label}} must be true or false",
                "array.min": "{{#label}} must contain at least {{#limit}} items"
            }
        })
        .validate(object);

    if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        return next(new ApiError(400, errorMessage));
    };
    Object.assign(req, value);
    return next();
};

