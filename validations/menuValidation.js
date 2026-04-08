import Joi from 'joi';

const ingredientSchema = Joi.object({
  inventoryItemId: Joi.string().hex().length(24).required(),
  name: Joi.string().trim().min(2).max(100).required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string()
    .valid('ml', 'L', 'g', 'kg', 'pcs', 'packets', 'box', 'dozen')
    .required(),
});

const menuSchema = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    category: Joi.string().required(),
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

    ingredients: Joi.array().items(ingredientSchema).optional(),
    preparationInstructions: Joi.array()
      .items(Joi.string().trim().max(300))
      .optional(),
    servingSize: Joi.number().positive().optional(),
    preparationTime: Joi.number().positive().optional(),
    note: Joi.string().trim().max(500).optional(),
  }),
};

const updateMenuSchema = {
  params: Joi.object({
    menuId: Joi.string().hex().length(24).required(),
  }),

  body: Joi.object({
    name: Joi.string().trim().min(2).max(100).optional(),
    category: Joi.string().optional(),
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

    ingredients: Joi.array().items(ingredientSchema).optional(),
    preparationInstructions: Joi.array()
      .items(Joi.string().trim().max(300))
      .optional(),
    note: Joi.string().trim().max(500).optional(),
    servingSize: Joi.number().positive().optional(),
    preparationTime: Joi.number().positive().optional(),
  }).min(1),
};

export { menuSchema, updateMenuSchema };
