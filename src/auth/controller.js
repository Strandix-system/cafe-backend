import service from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";
export default {
  register: async (req, res) => {
    const result = await service.register(req.body);
    sendSuccessResponse(res, 200, "User registered successfully", result);
  },

  login: async (req, res) => {
    const result = await service.login(req.body);
    sendSuccessResponse(res, 200, "Login successful", result);
  },

  me: async (req, res) => {
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
        isProfileComplete,
      }
    );
  },
  logout: async (req, res) => {
    const result = await service.logout(req.user._id);
    sendSuccessResponse(res, 200, "Logout successful", result);
  },
  forgotPassword: async (req, res) => {
    const { email } = req.body;
    await service.forgotPassword(email);
    sendSuccessResponse(res, 200, "Reset link sent to email");
  },
  resetPassword: async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;

    await service.resetPassword(token, password);

    sendSuccessResponse(res, 200, "Password reset successful");
  },
  changePassword: async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await service.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );
    sendSuccessResponse(res, 200, "Password changed successfully");
  },
};
