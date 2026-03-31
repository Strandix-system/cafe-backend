import Joi from "joi";
import emailValidator from "email-validator";

const objectId = Joi.string().hex().length(24);
const nameRule = Joi.string().trim().min(2).max(50).pattern(/^[a-zA-Z ]+$/);
const emailRule = Joi.string().trim().lowercase().max(100).custom((value, helpers) => {
  if (!emailValidator.validate(value)) {
    return helpers.message("Invalid email address");
  }
  return value;
});

const socialLinksSchema = Joi.object({
  facebook: Joi.string()
    .uri({ scheme: ['http', 'https'] }).allow('', null)
    .messages({
      "string.uri": "Facebook must be a valid URL starting with http or https",
    }),

  instagram: Joi.string()
    .uri({ scheme: ['http', 'https'] }).allow('', null)
    .messages({
      "string.uri": "Instagram must be a valid URL starting with http or https",
    }),

  twitter: Joi.string()
    .uri({ scheme: ['http', 'https'] }).allow('', null)
    .messages({
      "string.uri": "Twitter must be a valid URL starting with http or https",
    }),
}).optional();

const phoneRule = Joi.number().integer().min(6000000000).max(9999999999);
const passwordRule = Joi.string().min(8).max(32).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/);
const streetRule = Joi.string().trim().min(2).max(200);
const pincodeRule = Joi.number().integer().min(100000).max(999999);
const addressCreateRule = Joi.object({
  street: streetRule.required(),
  city: Joi.string().trim().min(2).max(50).required(),
  state: Joi.string().trim().min(2).max(50).required(),
  pincode: pincodeRule.required(),
});
const addressUpdateRule = Joi.object({
  street: streetRule,
  city: Joi.string().trim().min(2).max(50),
  state: Joi.string().trim().min(2).max(50),
  pincode: pincodeRule,
}).min(1);
const gstCreateRule = Joi.object({
  gstNumber: Joi.string().trim().allow("", null),
  gstPercentage: Joi.number().min(5).max(18).required(),
  gstType: Joi.string().valid("inclusive", "exclusive"),
});
const gstUpdateRule = Joi.object({
  gstNumber: Joi.string().trim().allow("", null),
  gstPercentage: Joi.number().min(5).max(18),
  gstType: Joi.string().valid("inclusive", "exclusive"),
}).min(1);

const createAdminValidator = {
  body: Joi.object({
    firstName: nameRule.required(),
    lastName: Joi.string().trim().min(2).max(200).required(),
    cafeName: Joi.string().trim().min(2).max(100).required(),
    email: emailRule.required(),
    phoneNumber: phoneRule.required(),
    password: passwordRule.required(),
    address: addressCreateRule.required(),
    hours: Joi.any().required(),
    socialLinks: socialLinksSchema.optional(),
    gst: gstCreateRule,
  }),
};

const updateAdminValidator = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    firstName: nameRule,
    lastName: nameRule,
    role: Joi.string().valid("admin").optional(),
    email: Joi.string().email().lowercase(),
    password: Joi.string().min(6),
    cafeName: Joi.string().trim().min(2).max(100),
    phoneNumber: phoneRule,
    address: addressUpdateRule,
    logo: Joi.any(),
    profileImage: Joi.any(),
    gst: gstUpdateRule,
    isActive: Joi.boolean(),
    hours: Joi.any().optional(), 
    socialLinks: socialLinksSchema.optional(),
  }).min(0) 
};
const deleteAdminValidator = {
  params: Joi.object().keys({
    id: Joi.string()
      .hex()
      .length(24)
      .required(),
  }),
};
const updateProfileValidator = {
  body: Joi.object({
    firstName: nameRule,
    lastName: nameRule,
    email: Joi.string().email().lowercase(),
    phoneNumber: phoneRule,
    profileImage: Joi.any(),
    hours: Joi.string().optional(), 
    socialLinks: socialLinksSchema.optional(),
  }).min(1)
};
const updateSuperAdmin = {
  params: Joi.object({
    id: objectId.required(),
  }),
   body: Joi.object({
    firstName: nameRule,
    lastName: nameRule,
     phoneNumber: phoneRule,
     profileImage: Joi.any(),
       }).min(1)
};
export { createAdminValidator, updateAdminValidator, deleteAdminValidator, updateProfileValidator,updateSuperAdmin };
