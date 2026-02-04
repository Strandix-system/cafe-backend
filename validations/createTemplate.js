import Joi from "joi";

export const createCafeLayoutValidator = Joi.object({

  homeImage: Joi.string().required(),
  aboutImage: Joi.string().required(),

  menuTitle: Joi.string().trim().required(),

  categories: Joi.array()
    .items(Joi.string())
    .min(1)
    .required(),

  aboutTitle: Joi.string().trim().required(),
  aboutDescription: Joi.string().trim().required(),
  cafeDescription: Joi.string().trim().required(),

  defaultLayout: Joi.boolean().optional(),
});
