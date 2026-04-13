import emailValidator from 'email-validator';
import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

const nameRule = Joi.string().trim().min(2).max(50);
const socialLinksSchema = Joi.object({
  facebook: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('', null)
    .messages({
      'string.uri': 'Facebook must be a valid URL starting with http or https',
    }),

  instagram: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('', null)
    .messages({
      'string.uri': 'Instagram must be a valid URL starting with http or https',
    }),

  twitter: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('', null)
    .messages({
      'string.uri': 'Twitter must be a valid URL starting with http or https',
    }),
}).optional();

const emailRule = Joi.string()
  .trim()
  .lowercase()
  .max(100)
  .custom((value, helpers) => {
    if (!emailValidator.validate(value)) {
      return helpers.message('Invalid email address');
    }
    return value;
  });
const phoneNumberRule = Joi.number().integer().min(1000000000).max(9999999999);
const passwordRule = Joi.string().min(6).max(30);

const outletNameRule = Joi.string().trim().min(2).max(120);
const outletCodeRule = Joi.string().trim().min(2).max(50);

const AddressCreateRule = Joi.object({
  street: Joi.string().trim().min(2).max(200).required(),
  city: Joi.string().trim().min(2).max(80).required(),
  state: Joi.string().trim().min(2).max(80).required(),
  pincode: Joi.number().integer().min(100000).max(999999).required(),
});

const AddressUpdateRule = Joi.object({
  street: Joi.string().trim().min(2).max(200),
  city: Joi.string().trim().min(2).max(80),
  state: Joi.string().trim().min(2).max(80),
  pincode: Joi.number().integer().min(100000).max(999999),
}).min(1);

export const createOutletManagerValidator = {
  body: Joi.object({
    firstName: nameRule.required(),
    lastName: nameRule.required(),
    email: emailRule.required(),
    password: passwordRule.required(),
    phoneNumber: phoneNumberRule.required(),
    outletName: outletNameRule.required(),
    outletCode: outletCodeRule.required(),
    address: AddressCreateRule.required(),
    hours: Joi.any().required(),
    socialLinks: socialLinksSchema.optional(),
  }),
};

export const updateOutletManagerValidator = {
  params: Joi.object({
    outletId: objectId.required(),
  }),
  body: Joi.object({
    firstName: nameRule,
    lastName: nameRule,
    email: emailRule,
    password: passwordRule,
    phoneNumber: phoneNumberRule,
    outletName: outletNameRule,
    outletCode: outletCodeRule,
    address: AddressUpdateRule,
    isActive: Joi.boolean(),
  }).min(1),
};

export const deleteOutletManagerValidator = {
  params: Joi.object({
    outletId: objectId.required(),
  }),
};

export const listOutletsValidator = {
  query: Joi.object({
    search: Joi.string().trim().max(120),
    page: Joi.number().integer().min(0),
    limit: Joi.number().integer().min(1).max(100),
    sortBy: Joi.string().trim().max(120),
  }).unknown(true),
};
