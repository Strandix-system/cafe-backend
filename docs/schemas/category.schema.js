export const categorySchemas = {
  Category: {
    type: 'object',
    properties: {
      _id: {
        $ref: '#/components/schemas/MongoId',
      },
      name: {
        type: 'string',
        example: 'Beverages',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  CreateCategoryRequest: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        example: 'Fast Food',
      },
    },
  },

  UpdateCategoryRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Main Course',
      },
    },
  },
};
