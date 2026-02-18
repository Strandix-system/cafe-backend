import service from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";

export default {
  register: async (req, res, next) => {
    try {
      const result = await service.register(req.body);

      sendSuccessResponse(
        res,
        201,
        "User registered successfully",
        result
      );
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const result = await service.login(req.body);

      sendSuccessResponse(
        res,
        200,
        "Login successful",
        result
      );
    } catch (error) {
      next(error);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = req.user;

      sendSuccessResponse(
        res,
        200,
        "Profile fetched successfully",
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

    sendSuccessResponse(
      res,
      200,
      "Logout successful",
      result
    );
  } catch (error) {
    next(error);
  }
}

};
