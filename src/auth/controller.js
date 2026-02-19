import service from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";
export default {
  register: async (req, res, next) => {
    try {
      const result = await service.register(req.body);
      sendSuccessResponse(res, 200, "User registered successfully", result);
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const result = await service.login(req.body);
      sendSuccessResponse(res, 200, "Login successful", result);
    } catch (error) {
      next(error);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = req.user.toObject();
      sendSuccessResponse(res, 200, "Profile fetched successfully",
        {
          id: user._id,
          ...user
        }
      );
    } catch (error) {
      next(error);
    }
  },
  logout: async (req, res, next) => {
    try {
      const result = await service.logout(req.user._id);
      sendSuccessResponse(res, 200, "Logout successful", result);
    } catch (error) {
      next(error);
    }
  },
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      await service.forgotPassword(email);
      sendSuccessResponse(res, 200, "Reset link sent to email");
    } catch (error) {
      next(error);
    }
  },
  resetPassword: async (req, res,next) => {
    try {
      const { password } = req.body;
      const { token } = req.params;

      await service.resetPassword(token, password);

       sendSuccessResponse(res, 200, "Password reset successful");
    } catch (error) {
      next(error);
    }
  },
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      await service.changePassword(
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
