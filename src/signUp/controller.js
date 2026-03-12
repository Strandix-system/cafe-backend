import signUpService from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";
import { ApiError } from "../../utils/apiError.js";

const signUpController = {
  createOrder: async (req, res, next) => {
    try {
      const order = await signUpService.createRazorpayOrder();
      sendSuccessResponse(res, 200, "Order created", order);
    } catch (error) {
      next(error);
    }
  },
  verifyPayment: async (req, res, next) => {
    try {
      const result = await signUpService.verifyPaymentAndCreateUser(req.body);
      sendSuccessResponse(res, 201, "Signup successful", result);
    } catch (error) {
      next(error);
    }
  },
  checkEmail: async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ApiError(400, "Email is required");
      }

      const result = await signUpService.checkEmailExists(email);

      return sendSuccessResponse(res, 201, "Email is Valid", result);
    } catch (error) {
      next(error);
    }
  },
};

export default signUpController;
