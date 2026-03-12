
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../model/user.js";
import razorpay from "../../config/razorpay.js";
import { ApiError } from "../../utils/apiError.js";

const SIGNUP_AMOUNT = 10; 

const signUpService = {
  
  createRazorpayOrder: async () => {
    const options = {
      amount: SIGNUP_AMOUNT * 100,
      currency: "INR",
      receipt: `signup_${Date.now()}`,
      notes: {
        purpose: "User Signup",
      },
    };

    return await razorpay.orders.create(options);
  },
  verifyPaymentAndCreateUser: async (data) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
    } = data;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Payment verification failed");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "User already exists");
    }
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: password,
      phoneNumber: phoneNumber,
      role: "admin", 
    });
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      user,
      token,
    };
  },
  checkEmailExists: async (email) => {
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      throw new ApiError(409, "Email already registered.");
    }

    return {
      message: "Email is available.",
    };
  },

};

export default signUpService;
