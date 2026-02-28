// signup controller

import signUpService from "./service.js";
import { sendSuccessResponse } from "../../utils/response.js";

const signUpController = {

  createOrder: async (req, res, next) => {
    try {
      const order = await signUpService.createRazorpayOrder();
      sendSuccessResponse(res, 200, "Order created", order);
    } catch (err) {
      next(err);
    }
  },
  verifyPayment: async (req, res, next) => {
    try {
      const result = await signUpService.verifyPaymentAndCreateUser(req.body);
      sendSuccessResponse(res, 201, "Signup successful", result);
    } catch (err) {
      next(err);
    }
  },
   checkEmail: async (req, res,next ) => {
    try {
      const { email, phoneNumber  } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const result = await signUpService.checkEmailExists(email,phoneNumber);

      return   sendSuccessResponse(res, 200,"Email is Valid", result);
    } catch (error) {
     next (error)
    }
  },
};

export default signUpController;