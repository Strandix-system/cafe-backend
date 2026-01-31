import Joi from "joi";

export const createTemplateValidator = {
  body: Joi.object({
    noOfImage: Joi.number().min(1).max(10).required(),
    cafeTitleLabel: Joi.string().min(2).max(100).required(),
    descriptionLabel: Joi.string().min(2).max(300).required()
  })
};

export const createCafeLayoutValidator = {
  body: Joi.object({
    layoutTemplateId: Joi.string().required(),
    cafeTitle: Joi.string().min(2).max(100).required(),
    description: Joi.string().min(2).max(500).required()
  })
};
