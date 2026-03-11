import { authService } from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";
export const authController = {
  register: async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      sendSuccessResponse(res, 200, "User registered successfully", result);
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      sendSuccessResponse(res, 200, "Login successful", result);
    } catch (error) {
      next(error);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = req.user.toObject();
      const isProfileComplete =
        new Date(user.createdAt).getTime() !==
        new Date(user.updatedAt).getTime();

      sendSuccessResponse(
        res,
        200,
        "Profile fetched successfully",
        {
          id: user._id,
          ...user,
          subscriptionAlert: req?.subscriptionAlert,
          isProfileComplete, 
        }
      );
    } catch (error) {
      next(error);
    }
  },
  logout: async (req, res, next) => {
    try {
      const result = await authService.logout(req.user._id);
      sendSuccessResponse(res, 200, "Logout successful", result);
    } catch (error) {
      next(error);
    }
  },
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      sendSuccessResponse(res, 200, "Reset link sent to email");
    } catch (error) {
      next(error);
    }
  },
  resetPassword: async (req, res, next) => {
    try {
      const { password } = req.body;
      const { token } = req.params;

      await authService.resetPassword(token, password);

      sendSuccessResponse(res, 200, "Password reset successful");
    } catch (error) {
      next(error);
    }
  },
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(
        req.user._id,
        currentPassword,
        newPassword
      );
      sendSuccessResponse(res, 200, "Password changed successfully");
    } catch (error) {
      next(error);
    }
  },
};
