import Joi from 'joi';

const objectId = Joi.string().hex().length(24);

const menuSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),

    category: objectId.required().messages({
      'string.hex': 'Category must be a valid ObjectId',
      'string.length': 'Category must be a valid ObjectId',
      'any.required': 'Category is required',
    }),

    description: Joi.string().trim().min(10).max(500).required(),
    price: Joi.number().positive().required(),
    discountPrice: Joi.number()
      .min(0)
      .max(Joi.ref('price'))
      .allow(null, '')
      .messages({
        'number.max':
          'Discount price must be less than or equal to the original price',
      })
      .optional(),
    isPopular: Joi.boolean(),
    isActive: Joi.boolean(),
    inStock: Joi.boolean(),
  }),
};
const updateMenuSchema = {
  params: Joi.object({
    menuId: Joi.string().hex().length(24).required(), // Validates MongoDB ObjectId
  }),
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),

    category: objectId.optional().messages({
      'string.hex': 'Category must be a valid ObjectId',
      'string.length': 'Category must be a valid ObjectId',
    }),

    description: Joi.string().trim().min(10).max(500).optional(),
    price: Joi.number().positive().optional(),
    discountPrice: Joi.number()
      .min(0)
      .max(Joi.ref('price'))
      .allow(null, '')
      .messages({
        'number.max':
          'Discount price must be less than or equal to the original price',
      })
      .optional(),
    image: Joi.any(),
    isPopular: Joi.boolean(),
    isActive: Joi.boolean(),
    inStock: Joi.boolean(),
  }).min(1),
};

export { menuSchema, updateMenuSchema };
