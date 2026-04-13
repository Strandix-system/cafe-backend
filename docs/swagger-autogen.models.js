export const swaggerAutogenModels = {
  LoginRequest: {
    email: 'admin@example.com',
    password: 'Password@123',
  },
  ForgotPasswordRequest: {
    email: 'admin@example.com',
  },
  ResetPasswordRequest: {
    password: 'NewPassword@123',
  },
  ChangePasswordRequest: {
    currentPassword: 'OldPassword@123',
    newPassword: 'NewPassword@123',
  },
  CreateCategoryRequest: {
    name: 'Fast Food',
  },
  UpdateCategoryRequest: {
    name: 'Main Course',
  },
};
