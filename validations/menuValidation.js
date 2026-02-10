import Joi from 'joi';

const menuSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    category: Joi.string().required(), // Assuming ObjectId string
    description: Joi.string().trim().min(10).max(500).required(),
    price: Joi.number().positive().required(),
    discountPrice: Joi.number().min(0).less(Joi.ref('price')).messages({
      'number.less': 'Discount price must be less than the original price'
    }),
    isPopular: Joi.boolean()

  })
};

const updateMenuSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required() // Validates MongoDB ObjectId
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    category: Joi.string(),
    description: Joi.string().trim().min(10).max(500),
    price: Joi.number().positive(),
    discountPrice: Joi.number().min(0).less(Joi.ref('price')),
    isPopular: Joi.boolean()
  }).min(0) // Allows updating just the image
};

export { menuSchema, updateMenuSchema };