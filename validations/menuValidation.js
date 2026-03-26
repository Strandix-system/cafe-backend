import Joi from 'joi';

const menuSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    category: Joi.string().required(), // Assuming ObjectId string
    description: Joi.string().trim().min(10).max(500).required(),
    price: Joi.number().positive().required(),
    discountPrice: Joi.number().min(0).max(Joi.ref('price')).allow(null,"")
      .messages({
        'number.max': 'Discount price must be less than or equal to the original price'
      }).optional(),
    isPopular: Joi.boolean(),
    isActive: Joi.boolean(),
    inStock: Joi.boolean(),
  })
};
const updateMenuSchema = {
  params: Joi.object({
    menuId: Joi.string().hex().length(24).required() // Validates MongoDB ObjectId
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    category: Joi.string().optional(),
    description: Joi.string().trim().min(10).max(500).optional(),
    price: Joi.number().positive().optional(),
    discountPrice: Joi.number().min(0).max(Joi.ref('price')).allow(null,"")
      .messages({
        'number.max': 'Discount price must be less than or equal to the original price'
      }).optional(),
    image: Joi.any(),
    isPopular: Joi.boolean(),
    isActive: Joi.boolean(),
    inStock: Joi.boolean(),
  }).min(0)
};

export { menuSchema, updateMenuSchema };
