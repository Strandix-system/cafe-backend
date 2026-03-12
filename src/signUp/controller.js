import signUpService from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";
import { ApiError } from "../../utils/apiError.js";

const signUpController = {
  createOrder: async (req, res) => {
    const order = await signUpService.createRazorpayOrder();
    sendSuccessResponse(res, 200, "Order created", order);
  },
  verifyPayment: async (req, res) => {
    const result = await signUpService.verifyPaymentAndCreateUser(req.body);
    sendSuccessResponse(res, 201, "Signup successful", result);
  },
  checkEmail: async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const result = await signUpService.checkEmailExists(email);

    return sendSuccessResponse(res, 201, "Email is Valid", result);
  },
};

export default signUpController;
