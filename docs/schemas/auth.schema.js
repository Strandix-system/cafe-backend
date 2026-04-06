export const authSchemas = {
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        example: 'admin@example.com',
      },
      password: {
        type: 'string',
        example: 'Password@123',
      },
    },
  },

  LogoutRequest: {
    type: 'object',
    properties: {
      refreshToken: {
        type: 'string',
        example: 'sample-refresh-token',
      },
    },
  },

  ForgotPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: {
        type: 'string',
        example: 'admin@example.com',
      },
    },
  },

  ResetPasswordRequest: {
    type: 'object',
    required: ['password'],
    properties: {
      password: {
        type: 'string',
        example: 'NewPassword@123',
      },
    },
  },

  ChangePasswordRequest: {
    type: 'object',
    required: ['oldPassword', 'newPassword'],
    properties: {
      oldPassword: {
        type: 'string',
        example: 'OldPassword@123',
      },
      newPassword: {
        type: 'string',
        example: 'NewPassword@123',
      },
    },
  },

  LoginResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Login successful',
      },
      result: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              _id: {
                $ref: '#/components/schemas/MongoId',
              },
              name: {
                type: 'string',
                example: 'Deepak Rathod',
              },
              email: {
                type: 'string',
                example: 'admin@example.com',
              },
              role: {
                type: 'string',
                example: 'admin',
              },
            },
          },
          accessToken: {
            type: 'string',
            example: 'jwt-access-token',
          },
          refreshToken: {
            type: 'string',
            example: 'jwt-refresh-token',
          },
        },
      },
    },
  },
};
