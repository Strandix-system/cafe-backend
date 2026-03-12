import Joi from "joi";

const objectId = Joi.string().hex().length(24);

const createCategoryValidator = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
  }),
};

const updateCategoryValidator = {
  params: Joi.object({
    categoryId: objectId.required(),
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
  }),
};

const categoryIdParamValidator = {
  params: Joi.object({
    categoryId: objectId.required(),
  }),
};

const idParamValidator = {
  params: Joi.object({
    id: objectId.required(),
  }),
};

export {
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdParamValidator,
  idParamValidator,
};
