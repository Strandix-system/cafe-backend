export const commonSchemas = {
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Success',
      },
      result: {
        type: 'object',
      },
    },
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      message: {
        type: 'string',
        example: 'Something went wrong',
      },
    },
  },
  PaginationResponse: {
    type: 'object',
    properties: {
      page: {
        type: 'number',
        example: 1,
      },
      limit: {
        type: 'number',
        example: 10,
      },
      totalPages: {
        type: 'number',
        example: 5,
      },
      totalResults: {
        type: 'number',
        example: 50,
      },
    },
  },
  MongoId: {
    type: 'string',
    example: '67f1d0f5d4b4d90c1c8f1111',
  },
};
