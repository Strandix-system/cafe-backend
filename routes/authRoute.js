import express from "express";
import { authController } from "../src/auth/controller.js";
import { tokenVerification } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  registerValidator,
  loginValidator,
  logoutValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
} from "../validations/authValidation.js";
import { allowRoles } from "../middleware/permission.js";
import { checkSubscription } from "../middleware/checkSubscription.js";

export const authRoute = express.Router();

authRoute.post(
  "/register",
  validate(registerValidator),
  authController.register
);
authRoute.post(
  "/login",
  validate(loginValidator),
  authController.login
);
authRoute.post(
  "/logout",
  tokenVerification,
  validate(logoutValidator),
  authController.logout
);

authRoute.post(
  "/forgot-password",
  validate(forgotPasswordValidator),
  authController.forgotPassword
);
authRoute.post(
  "/reset-password/:token",
  validate(resetPasswordValidator),
  authController.resetPassword
);
authRoute.get(
  "/me",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  checkSubscription,
  authController.me
);
authRoute.post(
  "/change-password",
  tokenVerification,
  allowRoles("admin", "superadmin"),
  validate(changePasswordValidator),
  authController.changePassword
);

